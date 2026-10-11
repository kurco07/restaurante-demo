-- ============================================================
-- Fase 3, Módulo 3 (ajuste) — no abrir una sesión nueva en una mesa no disponible
-- ============================================================
-- Bug encontrado probando el Módulo 3: si el celular del cliente sigue
-- abierto después de que el mesonero cerró la cuenta, puede mandar otro
-- pedido y enviar_pedido_autopedido le abría una sesión nueva sobre una
-- mesa que quedó "por_limpiar" (recién cerrada, sin resetear). Ahora
-- solo se abre una sesión nueva si la mesa está 'libre'. Si ya hay una
-- sesión abierta (el caso normal: agregar más al pedido en curso), esto
-- no aplica — solo afecta el momento de abrir una mesa por primera vez.

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
    if not exists (select 1 from mesas where id = p_mesa_id and estado = 'libre') then
      raise exception 'Esta mesa no está disponible para pedir en este momento — pídele ayuda a tu mesonero.';
    end if;

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
      'por_aprobar',
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
