-- ============================================================
-- Personalización completa — Ronda 2: redes sociales en el menú
-- público (sin sesión) — solo menu_publico_tenant, que es lo que
-- consume InicioPage.tsx (la vitrina). menu_publico_mesa (autopedido)
-- no las necesita: ahí la prioridad es pedir, no navegar redes.
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
      'marca_agua_tamano', coalesce(pm.marca_agua_tamano, 680),
      'red_instagram', pm.red_instagram,
      'red_whatsapp', pm.red_whatsapp,
      'red_facebook', pm.red_facebook,
      'red_enlace_libre', pm.red_enlace_libre,
      'red_enlace_libre_etiqueta', pm.red_enlace_libre_etiqueta
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
