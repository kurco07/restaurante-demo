-- ============================================================
-- Fase 7, Módulo 5 — conecta tenant_modulos (0029) con el aprovisionamiento
-- y con el menú público de la mesa
-- ============================================================

-- provisionar_tenant (0027): un restaurante nuevo por self-service arranca
-- en plan 'starter', así que sus módulos opcionales (IA, alertas, multi-
-- sede, RA) empiezan apagados — coherente con la tabla de precios. Se
-- prenden cuando super-admin lo sube a Pro o los activa a mano.
create or replace function public.provisionar_tenant(
  p_auth_user_id uuid,
  p_nombre_restaurante text,
  p_nombre_usuario text,
  p_telefono text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_sede_id uuid;
  v_slug text;
  v_modulo text;
begin
  if coalesce(trim(p_nombre_restaurante), '') = '' then
    raise exception 'El nombre del restaurante es obligatorio.';
  end if;
  if coalesce(trim(p_nombre_usuario), '') = '' then
    raise exception 'El nombre del usuario es obligatorio.';
  end if;

  v_slug := lower(regexp_replace(trim(p_nombre_restaurante), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.tenants (nombre, slug, plan, estado)
  values (trim(p_nombre_restaurante), v_slug, 'starter', 'activo')
  returning id into v_tenant_id;

  insert into public.sedes (tenant_id, nombre)
  values (v_tenant_id, 'Principal')
  returning id into v_sede_id;

  insert into public.usuarios (id, tenant_id, sede_id, nombre, contacto, rol)
  values (p_auth_user_id, v_tenant_id, v_sede_id, trim(p_nombre_usuario), p_telefono, 'gerencia');

  insert into public.suscripciones (tenant_id, plan, precio_acordado, proveedor_de_pago, estado, proximo_cobro)
  values (v_tenant_id, 'starter', 29.00, 'manual', 'activa', (now() + interval '14 days')::date);

  insert into public.personalizacion_marca (tenant_id, nombre_mostrado)
  values (v_tenant_id, trim(p_nombre_restaurante));

  foreach v_modulo in array array[
    'ia_sugerencias_compra', 'ia_sugerencias_platos', 'ia_recomendados',
    'alertas_gerencia', 'multi_sede', 'realidad_aumentada'
  ]
  loop
    insert into public.tenant_modulos (tenant_id, modulo, activo) values (v_tenant_id, v_modulo, false);
  end loop;

  return v_tenant_id;
end;
$$;

revoke all on function public.provisionar_tenant(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.provisionar_tenant(uuid, text, text, text) to service_role;

-- menu_publico_mesa (0003, extendida en 0028): el cliente por QR no tiene
-- sesión, así que no puede leer tenant_modulos por su cuenta (RLS se lo
-- impide, a propósito) — se le agrega acá, ya calculado, para que sepa si
-- mostrar el botón de RA y la franja de recomendados. "Sin filas todavía"
-- (tenants de antes de este módulo) se trata como todo prendido, igual
-- que ya quedó resuelto con el backfill de la migración 0029.
create or replace function public.menu_publico_mesa(p_mesa_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'restaurante', coalesce(pm.nombre_mostrado, t.nombre),
    'marca', jsonb_build_object(
      'logo_url', pm.logo_url,
      'color_primario', pm.color_primario,
      'color_secundario', pm.color_secundario
    ),
    'modulos', jsonb_build_object(
      'realidad_aumentada', coalesce((
        select tm.activo from tenant_modulos tm where tm.tenant_id = t.id and tm.modulo = 'realidad_aumentada'
      ), true),
      'ia_recomendados', coalesce((
        select tm.activo from tenant_modulos tm where tm.tenant_id = t.id and tm.modulo = 'ia_recomendados'
      ), true)
    ),
    'mesa', jsonb_build_object('id', m.id, 'nombre_numero', m.nombre_numero),
    'categorias', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'nombre', c.nombre) order by c.orden, c.nombre)
      from categorias_menu c
      where c.tenant_id = m.tenant_id
    ), '[]'::jsonb),
    'platos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', mi.id,
        'categoria_id', mi.categoria_id,
        'nombre', mi.nombre,
        'descripcion', mi.descripcion,
        'precio', coalesce(mis.precio_override, mi.precio_base),
        'imagen_url', mi.imagen_url
      ) order by mi.nombre)
      from menu_items mi
      left join menu_item_sede mis on mis.menu_item_id = mi.id and mis.sede_id = m.sede_id
      where mi.tenant_id = m.tenant_id
        and coalesce(mis.disponible, true)
    ), '[]'::jsonb)
  )
  from mesas m
  join tenants t on t.id = m.tenant_id
  left join personalizacion_marca pm on pm.tenant_id = t.id
  where m.id = p_mesa_id
    and t.estado = 'activo'
$$;
