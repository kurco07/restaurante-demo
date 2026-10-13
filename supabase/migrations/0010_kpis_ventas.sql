-- ============================================================
-- Fase 5, Módulo 1 — Dashboard de KPIs (parte de ventas)
-- ============================================================
-- Agrega en el servidor las ventas de un período para el dashboard de
-- gerencia, en vez de bajar todas las filas al navegador. Solo ventas:
-- rentabilidad por plato y rotación de inventario necesitan costos y
-- movimientos de inventario, que llegan con la Fase 4 (Cesar), y se
-- agregan después.
--
-- security invoker (el default): la función corre con los permisos de
-- quien la llama, así que las políticas RLS de cada tabla siguen siendo
-- la barrera entre restaurantes. Gerencia ve todas las sedes de su
-- tenant; p_sede_id filtra a una sola (base para el Módulo 3,
-- multi-sede).
--
-- De dónde sale cada número:
-- - Una "venta" es una cuenta cerrada: sesiones_mesa con estado
--   'cerrada' y cerrada_en dentro del período. pagos_cierre no guarda
--   fecha propia, por eso el período se toma de cerrada_en.
-- - ventas = suma de pagos_cierre.monto (subtotal, sin propina, ver
--   CierreCuentaModal); propinas va aparte.
-- - Platos y categorías salen de pedidos_items de esas cuentas, a su
--   precio_unitario congelado. Se excluyen los ítems 'por_aprobar' (un
--   pedido por QR que nunca se confirmó no se vendió).
-- - Días y horas se calculan en la zona horaria de cada sede.

create or replace function public.kpis_ventas(
  p_desde timestamptz,
  p_hasta timestamptz,
  p_sede_id uuid default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with cuentas as (
    select
      sm.id as sesion_id,
      sm.sede_id,
      sm.mesonero_id,
      sm.cerrada_en at time zone se.zona_horaria as cerrada_local,
      pc.monto,
      pc.propina,
      pc.metodo_de_pago
    from sesiones_mesa sm
    join pagos_cierre pc on pc.sesion_id = sm.id
    join sedes se on se.id = sm.sede_id
    where sm.estado = 'cerrada'
      and sm.cerrada_en >= p_desde
      and sm.cerrada_en < p_hasta
      and (p_sede_id is null or sm.sede_id = p_sede_id)
  ),
  items as (
    select
      pi.menu_item_id,
      pi.cantidad,
      pi.cantidad * pi.precio_unitario as importe
    from pedidos_items pi
    where pi.sesion_id in (select sesion_id from cuentas)
      and pi.estado <> 'por_aprobar'
  )
  select jsonb_build_object(
    'resumen', (
      select jsonb_build_object(
        'ventas', coalesce(sum(monto), 0),
        'propinas', coalesce(sum(propina), 0),
        'cuentas', count(distinct sesion_id),
        'ticket_promedio', case when count(distinct sesion_id) = 0 then 0
                                else round(sum(monto) / count(distinct sesion_id), 2) end
      )
      from cuentas
    ),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', dia, 'ventas', ventas, 'cuentas', n) order by dia)
      from (
        select cerrada_local::date as dia, sum(monto) as ventas, count(distinct sesion_id) as n
        from cuentas group by 1
      ) d
    ), '[]'::jsonb),
    'por_hora', coalesce((
      select jsonb_agg(jsonb_build_object('hora', hora, 'ventas', ventas, 'cuentas', n) order by hora)
      from (
        select extract(hour from cerrada_local)::int as hora, sum(monto) as ventas, count(distinct sesion_id) as n
        from cuentas group by 1
      ) h
    ), '[]'::jsonb),
    'por_metodo', coalesce((
      select jsonb_agg(jsonb_build_object('metodo', metodo_de_pago, 'ventas', ventas, 'cuentas', n) order by ventas desc)
      from (
        select metodo_de_pago, sum(monto) as ventas, count(distinct sesion_id) as n
        from cuentas group by 1
      ) m
    ), '[]'::jsonb),
    'por_mesonero', coalesce((
      select jsonb_agg(jsonb_build_object('mesonero', nombre, 'ventas', ventas, 'cuentas', n) order by ventas desc)
      from (
        select coalesce(u.nombre, 'Sin mesonero') as nombre, sum(c.monto) as ventas, count(distinct c.sesion_id) as n
        from cuentas c
        left join usuarios u on u.id = c.mesonero_id
        group by 1
      ) x
    ), '[]'::jsonb),
    'top_platos', coalesce((
      select jsonb_agg(jsonb_build_object('plato', nombre, 'cantidad', cantidad, 'importe', importe) order by cantidad desc, importe desc)
      from (
        select mi.nombre, sum(i.cantidad) as cantidad, sum(i.importe) as importe
        from items i
        join menu_items mi on mi.id = i.menu_item_id
        group by mi.nombre
        order by sum(i.cantidad) desc, sum(i.importe) desc
        limit 10
      ) p
    ), '[]'::jsonb),
    'por_categoria', coalesce((
      select jsonb_agg(jsonb_build_object('categoria', nombre, 'cantidad', cantidad, 'importe', importe) order by importe desc)
      from (
        select c.nombre, sum(i.cantidad) as cantidad, sum(i.importe) as importe
        from items i
        join menu_items mi on mi.id = i.menu_item_id
        join categorias_menu c on c.id = mi.categoria_id
        group by c.nombre
      ) k
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.kpis_ventas(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.kpis_ventas(timestamptz, timestamptz, uuid) to authenticated;
