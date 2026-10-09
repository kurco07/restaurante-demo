-- ============================================================
-- Fase 3, Módulo 2 — Envío seguro del autopedido a cocina
-- ============================================================
-- El cliente que escanea el QR no tiene sesión, así que no puede escribir
-- directo a sesiones_mesa/pedidos_items vía RLS (y no debe: esas políticas
-- siguen intactas). Esta función es la única puerta de escritura pública,
-- en el mismo espíritu que menu_publico_mesa (migración 0003) para lectura.
--
-- Decisiones:
-- - El precio de cada ítem se calcula del lado del servidor (menu_items +
--   menu_item_sede), nunca se confía en un precio que mande el cliente.
-- - Si la mesa no tiene una sesión abierta, el cliente abre una nueva con
--   origen = 'autopedido' y mesonero_id nulo (ya contemplado en
--   modelo-de-datos.md: "mesonero_id puede ser nulo si el cliente inició
--   por QR antes de que un mesonero se asigne"). Si ya hay una sesión
--   abierta (el mesonero la abrió primero), el pedido se agrega ahí.
-- - client_local_id lo genera el celular del cliente; on conflict do
--   nothing evita duplicar si el cliente reintenta el envío (ej. mala
--   conexión y vuelve a tocar "Enviar").
-- - Un ítem con menu_item_id inválido, de otro tenant, o marcado no
--   disponible en esa sede, simplemente no se inserta (no se confía en
--   el catálogo que el celular tenía cacheado).
--
-- Pendiente para cuando se construya la Fase 3, Módulo 3 (sesión
-- compartida): hoy una mesa cuya sesión tiene mesonero_id nulo no es
-- "mía" ni "de otro" para ningún mesonero en el mapa — hace falta una
-- forma de que alguien la atienda/reclame.

create or replace function public.enviar_pedido_autopedido(p_mesa_id uuid, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_sede_id uuid;
  v_sesion_id uuid;
  v_item jsonb;
begin
  select m.tenant_id, m.sede_id into v_tenant_id, v_sede_id
  from mesas m
  join tenants t on t.id = m.tenant_id
  where m.id = p_mesa_id and t.estado = 'activo';

  if v_tenant_id is null then
    raise exception 'Mesa no encontrada';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene ítems';
  end if;

  select id into v_sesion_id
  from sesiones_mesa
  where mesa_id = p_mesa_id and estado = 'abierta'
  order by abierta_en desc
  limit 1;

  if v_sesion_id is null then
    insert into sesiones_mesa (tenant_id, sede_id, mesa_id, mesonero_id, estado, origen, abierta_en)
    values (v_tenant_id, v_sede_id, p_mesa_id, null, 'abierta', 'autopedido', now())
    returning id into v_sesion_id;

    update mesas set estado = 'ocupada' where id = p_mesa_id and estado = 'libre';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into pedidos_items (
      tenant_id, sede_id, sesion_id, menu_item_id, cantidad, precio_unitario, notas, agregado_por, estado, client_local_id
    )
    select
      v_tenant_id,
      v_sede_id,
      v_sesion_id,
      mi.id,
      greatest(1, coalesce((v_item->>'cantidad')::int, 1)),
      coalesce(mis.precio_override, mi.precio_base),
      v_item->>'notas',
      null, -- agregado_por nulo = lo agregó el cliente
      'pendiente',
      (v_item->>'client_local_id')::uuid
    from menu_items mi
    left join menu_item_sede mis on mis.menu_item_id = mi.id and mis.sede_id = v_sede_id
    where mi.id = (v_item->>'menu_item_id')::uuid
      and mi.tenant_id = v_tenant_id
      and coalesce(mis.disponible, true)
    on conflict (sesion_id, client_local_id) do nothing;
  end loop;

  return v_sesion_id;
end;
$$;

revoke all on function public.enviar_pedido_autopedido(uuid, jsonb) from public;
grant execute on function public.enviar_pedido_autopedido(uuid, jsonb) to anon, authenticated;
