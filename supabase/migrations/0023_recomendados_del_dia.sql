-- ============================================================
-- Fase 6, Módulo 4 — Recomendados del día
-- ============================================================
-- Decisiones de Pedro (2026-10-28), ver Roadmap y Registro_de_Cambios.md:
-- - Es una lista APARTE de la de cocina (Módulo 3): esa dice cuánto
--   preparar; esta, qué OFRECER.
-- - La IA elige 3 a 5 platos (buen margen, insumos por vencer, con stock)
--   y gerencia aprueba, con la misma bandeja.
-- - Se ven en el menú del mesonero, en el autopedido QR del cliente y en
--   una pestaña "Sugeridos" del mesonero. Mesonero y cliente ven el plato
--   y una frase para ofrecerlo, nunca costos ni márgenes.
-- - Los números por plato son los mismos de datos_platos_preparar (0022);
--   no hace falta otra función de datos.

-- ------------------------------------------------------------
-- 1. Los recomendados los revisa solo gerencia
-- ------------------------------------------------------------
-- Misma función que en 0022; el único cambio es recomendado_del_dia.
create or replace function public.validar_sugerencia_ia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := coalesce(public.current_rol(), '');
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Las sugerencias de la IA no se borran: quedan como registro' using errcode = 'P0001';
  end if;

  if tg_op = 'INSERT' then
    new.estado := 'pendiente';
    new.revisada_por := null;
    new.revisada_en := null;
    new.generada_en := now();
    return new;
  end if;

  -- UPDATE
  if old.estado <> 'pendiente' then
    raise exception 'Esta sugerencia ya fue revisada y no se puede cambiar' using errcode = 'P0001';
  end if;
  if new.tipo <> old.tipo or new.tenant_id <> old.tenant_id or new.sede_id is distinct from old.sede_id
     or new.generada_en <> old.generada_en then
    raise exception 'No se puede cambiar el origen de una sugerencia' using errcode = 'P0001';
  end if;
  if new.estado = 'pendiente' then
    raise exception 'Una sugerencia pendiente solo se puede aprobar o rechazar' using errcode = 'P0001';
  end if;
  if old.tipo = 'compra' and v_rol <> 'administracion' then
    raise exception 'Solo administración puede revisar sugerencias de compra' using errcode = 'P0001';
  end if;
  if old.tipo in ('plato_a_preparar', 'recomendado_del_dia') and v_rol <> 'gerencia' then
    raise exception 'Solo gerencia puede revisar esta sugerencia' using errcode = 'P0001';
  end if;
  if v_rol not in ('administracion', 'gerencia') then
    raise exception 'Tu rol no puede revisar sugerencias de la IA' using errcode = 'P0001';
  end if;

  new.revisada_por := auth.uid();
  new.revisada_en := now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2. Aprobar los recomendados
-- ------------------------------------------------------------
-- p_items: lo que gerencia dejó, [{menu_item_id, frase}], de 1 a 5. La
-- frase es lo que leen mesonero y cliente: obligatoria y corta. Solo se
-- guarda en la sugerencia; no cambia el menú.
create or replace function public.aprobar_sugerencia_recomendados(p_sugerencia_id uuid, p_items jsonb)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_sug sugerencias_ia;
  v_invalidos integer;
  v_items jsonb;
begin
  if coalesce(public.current_rol(), '') <> 'gerencia' then
    raise exception 'Solo gerencia puede aprobar los recomendados del día' using errcode = '42501';
  end if;

  select * into v_sug from sugerencias_ia where id = p_sugerencia_id for update;
  if v_sug.id is null or v_sug.tipo <> 'recomendado_del_dia' then
    raise exception 'No existe esa sugerencia de recomendados' using errcode = 'P0001';
  end if;
  if v_sug.estado <> 'pendiente' then
    raise exception 'Esta sugerencia ya fue revisada' using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 5 then
    raise exception 'Deja entre 1 y 5 platos recomendados' using errcode = 'P0001';
  end if;

  select count(*) into v_invalidos
  from jsonb_array_elements(p_items) e
  where coalesce(btrim(e->>'frase'), '') = ''
     or length(btrim(e->>'frase')) > 140
     or not exists (select 1 from menu_items m where m.id = (e->>'menu_item_id')::uuid and m.tenant_id = v_sug.tenant_id);
  if v_invalidos > 0 then
    raise exception 'Cada plato necesita una frase de hasta 140 caracteres' using errcode = 'P0001';
  end if;

  -- En el orden que dejó gerencia
  select jsonb_agg(jsonb_build_object(
    'menu_item_id', e->>'menu_item_id',
    'plato', m.nombre,
    'frase', btrim(e->>'frase')
  ) order by n)
  into v_items
  from jsonb_array_elements(p_items) with ordinality as t(e, n)
  join menu_items m on m.id = (e->>'menu_item_id')::uuid;

  update sugerencias_ia
     set estado = 'aprobada',
         contenido = contenido || jsonb_build_object('aprobado', jsonb_build_object('items', v_items))
   where id = p_sugerencia_id;
end;
$$;

revoke all on function public.aprobar_sugerencia_recomendados(uuid, jsonb) from public, anon;
grant execute on function public.aprobar_sugerencia_recomendados(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- 3. Lo que ven mesonero y cliente: plato y frase, sin precios
-- ------------------------------------------------------------
-- La última lista aprobada HOY (zona de la sede) de una sede, solo con
-- los platos que la sede sigue ofreciendo (menu_item_sede).
create or replace function public.recomendados_de_sede(p_sede_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'aprobada_en', s.revisada_en,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'menu_item_id', x->>'menu_item_id',
        'plato', x->>'plato',
        'frase', x->>'frase'
      ) order by n)
      from jsonb_array_elements(s.contenido->'aprobado'->'items') with ordinality as t(x, n)
      left join menu_item_sede mis on mis.menu_item_id = (x->>'menu_item_id')::uuid and mis.sede_id = s.sede_id
      where coalesce(mis.disponible, true)
    ), '[]'::jsonb)
  )
  from sugerencias_ia s
  join sedes se on se.id = s.sede_id
  where s.tipo = 'recomendado_del_dia'
    and s.estado = 'aprobada'
    and s.sede_id = p_sede_id
    and (s.generada_en at time zone se.zona_horaria)::date = (now() at time zone se.zona_horaria)::date
  order by s.revisada_en desc
  limit 1
$$;

-- Solo para las dos funciones de abajo, que deciden de qué sede
revoke all on function public.recomendados_de_sede(uuid) from public, anon, authenticated;

-- Mesonero (y cualquier usuario con sede): los de su propia sede
create or replace function public.recomendados_hoy()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.recomendados_de_sede(public.current_sede_id())
  where public.current_sede_id() is not null
$$;

revoke all on function public.recomendados_hoy() from public, anon;
grant execute on function public.recomendados_hoy() to authenticated;

-- Cliente por QR (sin cuenta): los de la sede de esa mesa, con el mismo
-- control que el menú público (0003): la mesa existe y su restaurante
-- está activo
create or replace function public.recomendados_mesa(p_mesa_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.recomendados_de_sede(m.sede_id)
  from mesas m
  join tenants t on t.id = m.tenant_id
  where m.id = p_mesa_id and t.estado = 'activo'
$$;

revoke all on function public.recomendados_mesa(uuid) from public;
grant execute on function public.recomendados_mesa(uuid) to anon, authenticated;
