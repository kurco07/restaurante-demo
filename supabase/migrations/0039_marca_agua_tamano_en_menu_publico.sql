-- ============================================================
-- Personalización completa — Ronda 1 (ajuste): tamaño de marca de agua
-- también en el menú público (sin sesión)
-- ============================================================

create or replace function public.menu_publico_tenant(p_tenant_id uuid)
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
      'color_secundario', pm.color_secundario,
      'color_acento', pm.color_acento,
      'fuente', pm.fuente,
      'marca_agua_activa', coalesce(pm.marca_agua_activa, false),
      'marca_agua_opacidad', coalesce(pm.marca_agua_opacidad, 0.06),
      'marca_agua_tamano', coalesce(pm.marca_agua_tamano, 680)
    ),
    'sedes', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'nombre', s.nombre, 'direccion', s.direccion) order by s.nombre)
      from sedes s
      where s.tenant_id = t.id
    ), '[]'::jsonb),
    'categorias', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'nombre', c.nombre) order by c.orden, c.nombre)
      from categorias_menu c
      where c.tenant_id = t.id
    ), '[]'::jsonb),
    'platos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', mi.id,
        'categoria_id', mi.categoria_id,
        'nombre', mi.nombre,
        'descripcion', mi.descripcion,
        'precio', mi.precio_base,
        'imagen_url', mi.imagen_url
      ) order by mi.nombre)
      from menu_items mi
      where mi.tenant_id = t.id
    ), '[]'::jsonb)
  )
  from tenants t
  left join personalizacion_marca pm on pm.tenant_id = t.id
  where t.id = p_tenant_id
    and t.estado = 'activo'
$$;

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
      'color_secundario', pm.color_secundario,
      'color_acento', pm.color_acento,
      'fuente', pm.fuente,
      'marca_agua_activa', coalesce(pm.marca_agua_activa, false),
      'marca_agua_opacidad', coalesce(pm.marca_agua_opacidad, 0.06),
      'marca_agua_tamano', coalesce(pm.marca_agua_tamano, 680)
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
