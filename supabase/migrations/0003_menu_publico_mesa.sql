-- ============================================================
-- Fase 3, Módulo 1 — Menú público por mesa (autopedido por QR)
-- ============================================================
-- El cliente que escanea el QR no tiene sesión, así que RLS no le deja
-- leer mesas ni menú (y no debe: las políticas de esas tablas siguen
-- intactas). Esta función es la única puerta de lectura pública:
-- recibe el id de la mesa que viene en el enlace del QR (decisión: el
-- QR lleva el id de la mesa, no un token aparte) y devuelve solo lo
-- necesario para mostrar el menú de ESE restaurante — nunca datos de
-- otro tenant, nunca pedidos, usuarios ni inventario.
--
-- Solo lectura. La escritura del autopedido es Fase 3, Módulo 2, en
-- una función aparte.
--
-- Devuelve null si la mesa no existe (el cliente ve "QR no válido").

create or replace function public.menu_publico_mesa(p_mesa_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'restaurante', t.nombre,
    'mesa', jsonb_build_object('id', m.id, 'nombre_numero', m.nombre_numero),
    'categorias', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'nombre', c.nombre) order by c.orden, c.nombre)
      from categorias_menu c
      where c.tenant_id = m.tenant_id
    ), '[]'::jsonb),
    -- Mismo criterio que el menú del mesonero (usePedidos.ts): la sede de
    -- la mesa puede ocultar un plato (disponible = false) o cambiarle el
    -- precio (precio_override) vía menu_item_sede. Sin fila para esa sede,
    -- el plato está disponible a precio_base.
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
  where m.id = p_mesa_id
    and t.estado = 'activo'
$$;

revoke all on function public.menu_publico_mesa(uuid) from public;
grant execute on function public.menu_publico_mesa(uuid) to anon, authenticated;
