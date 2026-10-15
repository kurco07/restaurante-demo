-- ============================================================
-- Fase 5, Módulo 1 — Dashboard de KPIs (rotación de inventario)
-- ============================================================
-- Qué tan rápido se gasta cada insumo, para el dashboard de gerencia.
-- Sale de movimientos_inventario (Fase 4): cada salida por plato
-- entregado, merma, entrada y ajuste, con fecha. Va en unidades del
-- insumo, no en dinero: insumos no tiene costo (decisión de la Fase 4);
-- valorizarlo queda para cuando se decida cómo derivar el costo.
--
-- security invoker (el default), igual que kpis_ventas (0010): RLS de
-- inventario_sede y movimientos_inventario sigue separando restaurantes.
-- Gerencia ve todas las sedes de su tenant; p_sede_id filtra a una.
--
-- Convención de movimientos_inventario (ver inventarioService.ts y el
-- trigger de 0008): cantidad siempre positiva; 'entrada' y 'ajuste'
-- suman al stock, 'salida' y 'merma' restan.
--
-- Por insumo devuelve:
-- - consumo: salidas del período (lo gastado en platos entregados)
-- - merma: mermas del período
-- - stock_actual: inventario_sede hoy
-- - stock_promedio: promedio entre el stock al inicio y al final del
--   período, reconstruido restando al stock actual los movimientos
--   posteriores a cada punto
-- - rotacion: (consumo + merma) / stock_promedio — cuántas veces se
--   "vació" el stock en el período
-- - dias_alcanza: stock_actual / consumo diario del período (null si no
--   hubo consumo)
-- Los insumos 'estimado' (sal, aceite…) no se descuentan por receta
-- (decisión de la Fase 4), así que no se incluyen: siempre saldrían en 0.

create or replace function public.kpis_inventario(
  p_desde timestamptz,
  p_hasta timestamptz,
  p_sede_id uuid default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with stock as (
    select
      inv.insumo_id,
      sum(inv.cantidad_actual) as actual,
      -- un mínimo por sede no se puede sumar entre sedes con sentido:
      -- solo se devuelve cuando hay una sola sede en juego
      case when count(*) = 1 then max(inv.stock_minimo) end as minimo
    from inventario_sede inv
    where p_sede_id is null or inv.sede_id = p_sede_id
    group by inv.insumo_id
  ),
  mov as (
    select
      mo.insumo_id,
      sum(mo.cantidad) filter (where mo.tipo = 'salida' and mo.fecha >= p_desde and mo.fecha < p_hasta) as consumo,
      sum(mo.cantidad) filter (where mo.tipo = 'merma' and mo.fecha >= p_desde and mo.fecha < p_hasta) as merma,
      sum(mo.cantidad) filter (where mo.tipo = 'entrada' and mo.fecha >= p_desde and mo.fecha < p_hasta) as entradas,
      -- cambio neto de stock desde el inicio y desde el fin del período hasta hoy
      sum(case when mo.tipo in ('entrada', 'ajuste') then mo.cantidad else -mo.cantidad end)
        filter (where mo.fecha >= p_desde) as neto_desde_inicio,
      sum(case when mo.tipo in ('entrada', 'ajuste') then mo.cantidad else -mo.cantidad end)
        filter (where mo.fecha >= p_hasta) as neto_desde_fin
    from movimientos_inventario mo
    where (p_sede_id is null or mo.sede_id = p_sede_id)
      and mo.fecha >= p_desde
    group by mo.insumo_id
  ),
  filas as (
    select
      i.id,
      i.nombre,
      i.unidad_de_medida as unidad,
      coalesce(s.actual, 0) as stock_actual,
      s.minimo as stock_minimo,
      coalesce(m.consumo, 0) as consumo,
      coalesce(m.merma, 0) as merma,
      coalesce(m.entradas, 0) as entradas,
      (
        (coalesce(s.actual, 0) - coalesce(m.neto_desde_inicio, 0))
        + (coalesce(s.actual, 0) - coalesce(m.neto_desde_fin, 0))
      ) / 2 as stock_promedio,
      greatest(extract(epoch from (least(p_hasta, now()) - p_desde)) / 86400, 1) as dias
    from insumos i
    left join stock s on s.insumo_id = i.id
    left join mov m on m.insumo_id = i.id
    where i.tipo <> 'estimado'
      and (s.insumo_id is not null or m.insumo_id is not null)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'insumo_id', id,
    'insumo', nombre,
    'unidad', unidad,
    'consumo', round(consumo, 3),
    'merma', round(merma, 3),
    'entradas', round(entradas, 3),
    'stock_actual', round(stock_actual, 3),
    'stock_minimo', stock_minimo,
    'stock_promedio', round(stock_promedio, 3),
    'rotacion', case when stock_promedio > 0 then round((consumo + merma) / stock_promedio, 2) end,
    'dias_alcanza', case when consumo > 0 then round(stock_actual / (consumo / dias), 1) end
  ) order by nombre), '[]'::jsonb)
  from filas
$$;

revoke all on function public.kpis_inventario(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.kpis_inventario(timestamptz, timestamptz, uuid) to authenticated;
