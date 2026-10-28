-- ============================================================
-- Fase 6, Módulo 3 — Sugerencias de qué platos preparar
-- ============================================================
-- Decisiones de Pedro (2026-10-26), ver Roadmap y Registro_de_Cambios.md:
-- - Las genera y aprueba GERENCIA (usan rentabilidad y costos), por sede.
-- - Al aprobar, cocina ve "Platos sugeridos para hoy" SIN precios, con
--   porciones y motivo. No cambia el menú ni el inventario.
-- - La IA tiene en cuenta: porciones que alcanzan con el stock,
--   rentabilidad, lo que se vende ese día de la semana e insumos por
--   vencer.
-- - A mano, para el día, una pendiente a la vez por sede.
-- - Mismo esquema mixto que compras (0021): la base calcula los números,
--   la IA elige, ordena y explica (Edge Function ia-sugerir-platos).

-- ------------------------------------------------------------
-- 1. Quién puede leer y escribir sugerencias_ia
-- ------------------------------------------------------------
-- El contenido de las sugerencias trae costos y márgenes (compras,
-- platos). La política de 0002 deja leerlo a cualquiera del restaurante;
-- esta política restrictiva lo limita a administración y gerencia (y al
-- equipo del SaaS). Cocina ve sus platos sugeridos con
-- platos_sugeridos_hoy, más abajo, que no devuelve precios. Además cierra
-- el pendiente de 0021: un mesonero ya no puede insertar sugerencias.
create policy "sugerencias_ia_solo_gestion" on public.sugerencias_ia
  as restrictive
  for all
  using (coalesce(public.current_rol(), '') in ('administracion', 'gerencia', 'super_admin'))
  with check (coalesce(public.current_rol(), '') in ('administracion', 'gerencia', 'super_admin'));

-- ------------------------------------------------------------
-- 2. Quién revisa cada tipo (reemplaza la función del trigger de 0021)
-- ------------------------------------------------------------
-- compra → administración; plato_a_preparar → gerencia;
-- recomendado_del_dia → gerencia o administración (se decide en el
-- Módulo 4). El resto de las reglas no cambia.
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
  if old.tipo = 'plato_a_preparar' and v_rol <> 'gerencia' then
    raise exception 'Solo gerencia puede revisar sugerencias de platos a preparar' using errcode = 'P0001';
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
-- 3. Los números fijos de la sugerencia de platos
-- ------------------------------------------------------------
-- Por cada plato con receta disponible en la sede (menu_item_sede no lo
-- marca como no disponible):
-- - porciones_posibles: cuántas alcanzan con el stock de hoy, el mínimo
--   entre los insumos de la receta (los 'estimado' no cuentan, §5). Nulo
--   si la receta solo tiene insumos 'estimado'.
-- - insumo_limitante: el que pone ese límite
-- - ventas_esperadas: unidades vendidas ese mismo día de la semana,
--   promedio de las 4 semanas anteriores (zona horaria de la sede)
-- - vendidos_28d: unidades vendidas en 28 días
-- - precio (el de la sede si tiene uno propio), costo y margen por plato,
--   con el costo de las compras de la sede (la última compra; si nunca se
--   compró ahí, la de cualquier sede). costo_completo = false si algún
--   insumo nunca se compró: el margen queda nulo, nunca se asume costo 0.
-- - por_vencer: insumos de la receta con lotes abiertos que vencen en los
--   próximos 3 días, con los días que les quedan
-- security invoker: RLS decide qué ve quien llama. Como trae costos y
-- márgenes, a cualquier rol que no sea de gestión le devuelve la lista
-- vacía (cocina no ve precios, §4.10).
create or replace function public.datos_platos_preparar(p_sede_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  with sede as (
    select id, (now() at time zone zona_horaria)::date as hoy, zona_horaria
    from sedes
    where id = p_sede_id
      and coalesce(public.current_rol(), '') in ('gerencia', 'administracion', 'super_admin')
  ),
  platos as (
    select mi.id, mi.nombre, coalesce(mis.precio_override, mi.precio_base) as precio
    from menu_items mi
    left join menu_item_sede mis on mis.menu_item_id = mi.id and mis.sede_id = p_sede_id
    where coalesce(mis.disponible, true)
      and exists (select 1 from recetas r where r.menu_item_id = mi.id)
  ),
  costo_sede as (
    select insumo_id, costo_unitario from costo_insumo_actual where sede_id = p_sede_id
  ),
  costo_cualquiera as (
    select distinct on (insumo_id) insumo_id, costo_unitario
    from costo_insumo_actual
    order by insumo_id, comprado_en desc
  ),
  lineas as (
    select
      r.menu_item_id,
      i.nombre as insumo,
      i.tipo,
      r.cantidad_requerida,
      coalesce(inv.cantidad_actual, 0) as stock,
      coalesce(cs.costo_unitario, cc.costo_unitario) as costo_unitario
    from recetas r
    join platos p on p.id = r.menu_item_id
    join insumos i on i.id = r.insumo_id
    left join inventario_sede inv on inv.insumo_id = r.insumo_id and inv.sede_id = p_sede_id
    left join costo_sede cs on cs.insumo_id = r.insumo_id
    left join costo_cualquiera cc on cc.insumo_id = r.insumo_id
  ),
  porciones as (
    select distinct on (menu_item_id)
      menu_item_id,
      floor(greatest(stock, 0) / nullif(cantidad_requerida, 0))::int as porciones,
      insumo as limitante
    from lineas
    where tipo <> 'estimado' and cantidad_requerida > 0
    order by menu_item_id, greatest(stock, 0) / cantidad_requerida asc
  ),
  costos as (
    select
      menu_item_id,
      sum(cantidad_requerida * costo_unitario) as costo,
      bool_and(costo_unitario is not null) as completo
    from lineas
    group by menu_item_id
  ),
  ventas as (
    select
      pi.menu_item_id,
      sum(pi.cantidad) filter (
        where extract(dow from (pi.creado_en at time zone s.zona_horaria)) = extract(dow from s.hoy)
          and (pi.creado_en at time zone s.zona_horaria)::date < s.hoy
      ) / 4.0 as esperadas,
      sum(pi.cantidad) as total
    from pedidos_items pi
    cross join sede s
    where pi.sede_id = p_sede_id
      and pi.estado = 'entregado'
      and pi.creado_en >= (s.hoy - 28)::timestamp at time zone s.zona_horaria
    group by pi.menu_item_id
  ),
  vencer as (
    select
      r.menu_item_id,
      jsonb_agg(distinct jsonb_build_object('insumo', i.nombre, 'dias', l.fecha_vencimiento - s.hoy)) as lista
    from recetas r
    join platos p on p.id = r.menu_item_id
    join insumos i on i.id = r.insumo_id
    join lotes_insumo l on l.insumo_id = r.insumo_id and l.sede_id = p_sede_id
    cross join sede s
    where l.cerrado_en is null and l.cantidad_restante > 0
      and l.fecha_vencimiento is not null and l.fecha_vencimiento <= s.hoy + 3
    group by r.menu_item_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'menu_item_id', p.id,
    'plato', p.nombre,
    'porciones_posibles', po.porciones,
    'insumo_limitante', po.limitante,
    'ventas_esperadas', round(coalesce(v.esperadas, 0), 1),
    'vendidos_28d', coalesce(v.total, 0),
    'precio', p.precio,
    'costo', case when c.completo then round(c.costo, 2) end,
    'costo_completo', coalesce(c.completo, false),
    'margen', case when c.completo then round(p.precio - c.costo, 2) end,
    'margen_pct', case when c.completo and p.precio > 0 then round((p.precio - c.costo) / p.precio * 100, 1) end,
    'por_vencer', coalesce(ve.lista, '[]'::jsonb)
  ) order by p.nombre), '[]'::jsonb)
  from platos p
  left join porciones po on po.menu_item_id = p.id
  left join costos c on c.menu_item_id = p.id
  left join ventas v on v.menu_item_id = p.id
  left join vencer ve on ve.menu_item_id = p.id
  where exists (select 1 from sede)
$$;

revoke all on function public.datos_platos_preparar(uuid) from public, anon;
grant execute on function public.datos_platos_preparar(uuid) to authenticated;

-- ------------------------------------------------------------
-- 4. Aprobar una sugerencia de platos
-- ------------------------------------------------------------
-- p_items: lo que gerencia dejó después de revisar, [{menu_item_id,
-- porciones}]. Solo guarda la lista aprobada en la sugerencia: no toca el
-- menú ni el inventario (decisión de Pedro).
create or replace function public.aprobar_sugerencia_platos(p_sugerencia_id uuid, p_items jsonb)
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
    raise exception 'Solo gerencia puede aprobar sugerencias de platos' using errcode = '42501';
  end if;

  select * into v_sug from sugerencias_ia where id = p_sugerencia_id for update;
  if v_sug.id is null or v_sug.tipo <> 'plato_a_preparar' then
    raise exception 'No existe esa sugerencia de platos' using errcode = 'P0001';
  end if;
  if v_sug.estado <> 'pendiente' then
    raise exception 'Esta sugerencia ya fue revisada' using errcode = 'P0001';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Deja al menos un plato en la lista' using errcode = 'P0001';
  end if;

  select count(*) into v_invalidos
  from jsonb_array_elements(p_items) e
  where coalesce((e->>'porciones')::numeric, 0) < 1
     or (e->>'porciones')::numeric <> floor((e->>'porciones')::numeric)
     or not exists (select 1 from menu_items m where m.id = (e->>'menu_item_id')::uuid and m.tenant_id = v_sug.tenant_id);
  if v_invalidos > 0 then
    raise exception 'Cada plato necesita un número entero de porciones, al menos 1' using errcode = 'P0001';
  end if;

  -- Se guarda con el nombre y el motivo de la sugerencia original, que es
  -- lo que cocina va a leer
  select jsonb_agg(jsonb_build_object(
    'menu_item_id', e->>'menu_item_id',
    'plato', coalesce(orig->>'plato', m.nombre),
    'porciones', (e->>'porciones')::int,
    'motivo', coalesce(orig->>'motivo', '')
  ))
  into v_items
  from jsonb_array_elements(p_items) e
  join menu_items m on m.id = (e->>'menu_item_id')::uuid
  left join lateral (
    select x from jsonb_array_elements(v_sug.contenido->'items') x where x->>'menu_item_id' = e->>'menu_item_id' limit 1
  ) o(orig) on true;

  update sugerencias_ia
     set estado = 'aprobada',
         contenido = contenido || jsonb_build_object('aprobado', jsonb_build_object('items', v_items))
   where id = p_sugerencia_id;
end;
$$;

revoke all on function public.aprobar_sugerencia_platos(uuid, jsonb) from public, anon;
grant execute on function public.aprobar_sugerencia_platos(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- 5. Lo que ve cocina: los platos aprobados para hoy, sin precios
-- ------------------------------------------------------------
-- security definer porque cocina no puede leer sugerencias_ia (política
-- de arriba). Devuelve solo la última sugerencia aprobada hoy (zona de la
-- sede) de la sede de quien llama: plato, porciones y motivo. Nada de
-- costos ni márgenes.
create or replace function public.platos_sugeridos_hoy()
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
        'plato', x->>'plato',
        'porciones', (x->>'porciones')::int,
        'motivo', x->>'motivo'
      ))
      from jsonb_array_elements(s.contenido->'aprobado'->'items') x
    ), '[]'::jsonb)
  )
  from sugerencias_ia s
  join sedes se on se.id = s.sede_id
  where s.tipo = 'plato_a_preparar'
    and s.estado = 'aprobada'
    and s.tenant_id = public.current_tenant_id()
    and s.sede_id = public.current_sede_id()
    and (s.generada_en at time zone se.zona_horaria)::date = (now() at time zone se.zona_horaria)::date
  order by s.revisada_en desc
  limit 1
$$;

revoke all on function public.platos_sugeridos_hoy() from public, anon;
grant execute on function public.platos_sugeridos_hoy() to authenticated;
