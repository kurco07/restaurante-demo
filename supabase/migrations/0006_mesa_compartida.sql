-- ============================================================
-- Fase 3, Módulo 3 — Sesión de mesa compartida (mesonero + cliente)
-- ============================================================
-- Mesonero y cliente ven el mismo pedido de la mesa. El mesonero ya lo
-- ve vía PowerSync (pedidos_items de la sesión). El cliente no tiene
-- sesión ni PowerSync, así que lo lee con esta función pública, en el
-- mismo espíritu que menu_publico_mesa (0003, lectura) y
-- enviar_pedido_autopedido (0004, escritura). El cierre y el pago
-- siguen siendo siempre del mesonero: aquí no hay nada de eso.

-- ------------------------------------------------------------
-- 1. Lectura pública del pedido compartido de la mesa
-- ------------------------------------------------------------
-- Devuelve los ítems de la sesión abierta más reciente de la mesa (los
-- que cargó el mesonero y los que pidió el cliente por QR), con su
-- estado de cocina. Nunca devuelve nombres de usuarios, pagos ni datos
-- de otras mesas. Sin sesión abierta → sesion_abierta = false e items
-- vacíos (la mesa se cerró o nadie la abrió todavía). Mesa inexistente
-- o restaurante inactivo → null, igual que menu_publico_mesa.

create or replace function public.pedido_publico_mesa(p_mesa_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with mesa as (
    select m.id
    from mesas m
    join tenants t on t.id = m.tenant_id
    where m.id = p_mesa_id and t.estado = 'activo'
  ),
  sesion as (
    select s.id
    from sesiones_mesa s
    join mesa on mesa.id = s.mesa_id
    where s.estado = 'abierta'
    order by s.abierta_en desc
    limit 1
  )
  select jsonb_build_object(
    'sesion_abierta', exists (select 1 from sesion),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pi.id,
        'nombre', mi.nombre,
        'cantidad', pi.cantidad,
        'precio_unitario', pi.precio_unitario,
        'notas', pi.notas,
        'estado', pi.estado,
        -- agregado_por nulo = lo pidió el cliente por QR (0002/0004)
        'por_qr', pi.agregado_por is null
      ) order by pi.creado_en)
      from pedidos_items pi
      join menu_items mi on mi.id = pi.menu_item_id
      where pi.sesion_id = (select id from sesion)
    ), '[]'::jsonb)
  )
  from mesa
$$;

revoke all on function public.pedido_publico_mesa(uuid) from public;
grant execute on function public.pedido_publico_mesa(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- 2. origen = 'hibrido' cuando pidieron los dos
-- ------------------------------------------------------------
-- sesiones_mesa.origen ya contempla 'hibrido' (0002) pero nada lo
-- asignaba. Regla: una sesión abierta por el mesonero pasa a 'hibrido'
-- cuando el cliente pide por QR, y una abierta por el cliente pasa a
-- 'hibrido' cuando el mesonero carga un ítem. Se hace con un trigger
-- (y no dentro de enviar_pedido_autopedido o del cliente) para que
-- cubra ambos caminos, incluidos los pedidos del mesonero que suben
-- tarde desde la cola offline de PowerSync. El cambio vuelve a los
-- dispositivos por la sincronización normal de sesiones_mesa.

create or replace function public.marcar_sesion_hibrida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update sesiones_mesa
  set origen = 'hibrido'
  where id = new.sesion_id
    and (
      (origen = 'mesonero' and new.agregado_por is null)
      or (origen = 'autopedido' and new.agregado_por is not null)
    );
  return new;
end;
$$;

drop trigger if exists pedidos_items_marcar_sesion_hibrida on public.pedidos_items;
create trigger pedidos_items_marcar_sesion_hibrida
  after insert on public.pedidos_items
  for each row execute function public.marcar_sesion_hibrida();
