-- ============================================================
-- Panel principal de Administración + Pedidos (admin) — datos reales
-- ============================================================
-- Hasta ahora "Pedidos recientes" del panel principal y la pantalla
-- completa de Pedidos (Administración) mostraban datos de ejemplo
-- hardcodeados (mockData/panel.ts, mockData/pedidosAdmin.ts). No existía
-- ninguna función que devolviera, para una sede, la lista de sesiones de
-- mesa del día con sus platos, mesonero y total — lo que sí existe
-- (kpis_ventas, migración 0010) agrega para reportes, no lista pedido
-- por pedido.
--
-- Mismo patrón que kpis_ventas: security invoker (RLS de
-- sesiones_mesa/pedidos_items/mesas/usuarios ya deja entrar a
-- administracion/gerencia/super_admin a cualquier sede de su propio
-- tenant, igual que ya pasa con los reportes de gerencia).
--
-- Una fila por SESIÓN de mesa (no por ítem individual) — así el mesonero
-- y la mesa no se repiten por cada plato.
-- - Se excluyen las sesiones "perdedoras" de una fusión por duplicado
--   offline (fusionada_en is not null, migración 0031): sus platos ya se
--   redirigieron a la sesión que sobrevive, mostrarlas aparte sería
--   confuso (una fila casi vacía).
-- - Se excluyen los ítems 'por_aprobar' (autopedido sin confirmar
--   todavía): igual que en kpis_ventas, un pedido que nunca se confirmó
--   no es un pedido real todavía.
-- - El estado que se muestra en pantalla (cocina/listo/entregado/
--   cancelado) es una categoría de UI derivada de los estados reales de
--   pedidos_items — no existe (ni se agrega acá) un estado de "cuenta
--   pedida": no hay ninguna señal en el modelo de datos de que el
--   cliente pidió la cuenta antes de que el mesonero la cierre de
--   verdad, así que esa categoría del mockup original se queda fuera
--   hasta que exista esa señal.
-- ============================================================

create or replace function public.pedidos_admin_dia(p_sede_id uuid, p_desde timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  with sesiones as (
    select sm.id as sesion_id, sm.mesa_id, sm.mesonero_id, sm.estado as sesion_estado,
           sm.abierta_en, sm.cerrada_en
    from sesiones_mesa sm
    where sm.sede_id = p_sede_id
      and sm.fusionada_en is null
      and (sm.abierta_en >= p_desde or sm.cerrada_en >= p_desde)
  ),
  items as (
    select pi.sesion_id, pi.cantidad, pi.precio_unitario, pi.estado, mi.nombre
    from pedidos_items pi
    join menu_items mi on mi.id = pi.menu_item_id
    where pi.sesion_id in (select sesion_id from sesiones)
      and pi.estado <> 'por_aprobar'
  ),
  resumen_items as (
    select
      sesion_id,
      jsonb_agg(jsonb_build_object('nombre', nombre, 'cantidad', cantidad, 'precio_unitario', precio_unitario) order by nombre) as items,
      sum(cantidad * precio_unitario) filter (where estado <> 'anulado') as total,
      count(*) filter (where estado in ('pendiente', 'en_preparacion')) as n_en_curso,
      count(*) filter (where estado = 'listo') as n_listo,
      count(*) filter (where estado = 'anulado') as n_anulado,
      count(*) as n_total
    from items
    group by sesion_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'sesion_id', s.sesion_id,
    'mesa_numero', m.nombre_numero,
    'mesonero_nombre', coalesce(u.nombre, 'Sin mesonero'),
    'items', coalesce(ri.items, '[]'::jsonb),
    'total', coalesce(ri.total, 0),
    'estado', case
      when ri.n_total is null or ri.n_total = ri.n_anulado then 'cancelado'
      when ri.n_en_curso > 0 then 'cocina'
      when ri.n_listo > 0 then 'listo'
      else 'entregado'
    end,
    'abierta_en', s.abierta_en,
    'cerrada_en', s.cerrada_en
  ) order by coalesce(s.cerrada_en, s.abierta_en) desc), '[]'::jsonb)
  from sesiones s
  join mesas m on m.id = s.mesa_id
  left join usuarios u on u.id = s.mesonero_id
  left join resumen_items ri on ri.sesion_id = s.sesion_id
$$;

revoke all on function public.pedidos_admin_dia(uuid, timestamptz) from public, anon;
grant execute on function public.pedidos_admin_dia(uuid, timestamptz) to authenticated;
