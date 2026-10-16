-- ============================================================
-- Menú público por tenant, sin mesa — para el home público (/inicio),
-- que es una vitrina informativa del restaurante, no un flujo de pedido.
-- Pedir de verdad sigue siendo siempre por mesa (QR o mesonero,
-- CLAUDE.md); esto es solo lectura, sin precios por sede (no hay sede
-- todavía cuando alguien entra desde el home).
-- ============================================================

create or replace function public.menu_publico_tenant(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'restaurante', t.nombre,
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
  where t.id = p_tenant_id
    and t.estado = 'activo'
$$;
