-- ============================================================
-- Fase 5, Módulo 1 — Rentabilidad por plato y valor del inventario
-- ============================================================
-- insumos no tiene costo (decisión de la Fase 4). Decisión de producto
-- confirmada con Pedro (2026-10-15): el costo de un insumo es el de su
-- ÚLTIMA COMPRA RECIBIDA — con precios que cambian rápido, es lo que
-- cuesta hoy reponerlo; un promedio de compras viejas mostraría márgenes
-- mejores de lo que son.
--
-- El costo sale de ordenes_compra_items.costo_estimado, que es POR
-- UNIDAD del insumo (compraService.ts multiplica cantidad × costo). Solo
-- cuentan órdenes 'recibida': un borrador o una aprobada aún no es una
-- compra hecha. ordenes_compra no guarda fecha de recepción, así que
-- "última" se ordena por creado_en (0008).
--
-- Todo es security invoker, igual que kpis_ventas (0010) y
-- kpis_inventario (0011): RLS sigue separando restaurantes.

-- ------------------------------------------------------------
-- 1. Costo actual de cada insumo, por sede
-- ------------------------------------------------------------
-- Una fila por (sede, insumo): la última compra recibida en esa sede.
-- Reutilizable: rentabilidad, valor del inventario y, más adelante, la
-- Fase 6 (sugerencias de compra).

create or replace view public.costo_insumo_actual
with (security_invoker = true) as
select distinct on (oc.sede_id, oci.insumo_id)
  oc.tenant_id,
  oc.sede_id,
  oci.insumo_id,
  oci.costo_estimado as costo_unitario,
  oc.creado_en as comprado_en
from ordenes_compra_items oci
join ordenes_compra oc on oc.id = oci.orden_compra_id
where oc.estado = 'recibida'
  and oci.costo_estimado is not null
order by oc.sede_id, oci.insumo_id, oc.creado_en desc;

revoke all on public.costo_insumo_actual from anon;
grant select on public.costo_insumo_actual to authenticated;

-- ------------------------------------------------------------
-- 2. Rentabilidad por plato en un período
-- ------------------------------------------------------------
-- Por cada plato vendido en el período (mismas cuentas que kpis_ventas:
-- sesiones cerradas en el período con su pago, sin ítems 'por_aprobar'):
-- - vendidos e importe, al precio real cobrado (precio_unitario congelado)
-- - costo por plato = Σ cantidad_requerida de su receta × costo del insumo.
--   Con sede filtrada se usa el costo de esa sede; sin filtro, la compra
--   más reciente de cualquier sede del restaurante.
-- - estado: 'sin_receta' (no tiene receta), 'incompleto' (algún insumo de
--   la receta nunca se compró: costo parcial, sin margen) u 'ok'.
-- Nunca se asume costo 0.

create or replace function public.kpis_rentabilidad(
  p_desde timestamptz,
  p_hasta timestamptz,
  p_sede_id uuid default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with costos as (
    select distinct on (insumo_id) insumo_id, costo_unitario
    from costo_insumo_actual
    where p_sede_id is null or sede_id = p_sede_id
    order by insumo_id, comprado_en desc
  ),
  costo_receta as (
    select
      r.menu_item_id,
      sum(r.cantidad_requerida * c.costo_unitario) as costo,
      count(*) as insumos,
      count(c.costo_unitario) as insumos_con_costo
    from recetas r
    left join costos c on c.insumo_id = r.insumo_id
    group by r.menu_item_id
  ),
  cuentas as (
    select sm.id
    from sesiones_mesa sm
    where sm.estado = 'cerrada'
      and sm.cerrada_en >= p_desde
      and sm.cerrada_en < p_hasta
      and (p_sede_id is null or sm.sede_id = p_sede_id)
      and exists (select 1 from pagos_cierre pc where pc.sesion_id = sm.id)
  ),
  vendidos as (
    select
      pi.menu_item_id,
      sum(pi.cantidad) as cantidad,
      sum(pi.cantidad * pi.precio_unitario) as importe
    from pedidos_items pi
    where pi.sesion_id in (select id from cuentas)
      and pi.estado <> 'por_aprobar'
    group by pi.menu_item_id
  ),
  filas as (
    select
      mi.id,
      mi.nombre,
      v.cantidad,
      v.importe,
      cr.costo,
      case
        when cr.menu_item_id is null then 'sin_receta'
        when cr.insumos_con_costo < cr.insumos then 'incompleto'
        else 'ok'
      end as estado
    from vendidos v
    join menu_items mi on mi.id = v.menu_item_id
    left join costo_receta cr on cr.menu_item_id = v.menu_item_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'menu_item_id', id,
    'plato', nombre,
    'vendidos', cantidad,
    'importe', round(importe, 2),
    'precio_promedio', round(importe / cantidad, 2),
    -- costo parcial en 'incompleto', para mostrarlo marcado como tal
    'costo_unitario', round(costo, 2),
    'estado', estado,
    'margen_unitario', case when estado = 'ok' then round(importe / cantidad - costo, 2) end,
    'margen_pct', case when estado = 'ok' and importe > 0 then round((importe - costo * cantidad) / importe * 100, 1) end,
    'ganancia', case when estado = 'ok' then round(importe - costo * cantidad, 2) end
  ) order by nombre), '[]'::jsonb)
  from filas
$$;

revoke all on function public.kpis_rentabilidad(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.kpis_rentabilidad(timestamptz, timestamptz, uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. kpis_inventario (0011) + costo y valor del stock
-- ------------------------------------------------------------
-- Misma función que en 0011, con dos campos nuevos: costo_unitario (el
-- de la última compra recibida) y valor_stock = stock_actual × costo.
-- Insumo nunca comprado → ambos null (la pantalla muestra "—", no $0).
-- Se redefine aquí en vez de editar 0011, que ya está aplicada.

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
      sum(case when mo.tipo in ('entrada', 'ajuste') then mo.cantidad else -mo.cantidad end)
        filter (where mo.fecha >= p_desde) as neto_desde_inicio,
      sum(case when mo.tipo in ('entrada', 'ajuste') then mo.cantidad else -mo.cantidad end)
        filter (where mo.fecha >= p_hasta) as neto_desde_fin
    from movimientos_inventario mo
    where (p_sede_id is null or mo.sede_id = p_sede_id)
      and mo.fecha >= p_desde
    group by mo.insumo_id
  ),
  costos as (
    select distinct on (insumo_id) insumo_id, costo_unitario
    from costo_insumo_actual
    where p_sede_id is null or sede_id = p_sede_id
    order by insumo_id, comprado_en desc
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
      greatest(extract(epoch from (least(p_hasta, now()) - p_desde)) / 86400, 1) as dias,
      c.costo_unitario
    from insumos i
    left join stock s on s.insumo_id = i.id
    left join mov m on m.insumo_id = i.id
    left join costos c on c.insumo_id = i.id
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
    'dias_alcanza', case when consumo > 0 then round(stock_actual / (consumo / dias), 1) end,
    'costo_unitario', costo_unitario,
    'valor_stock', case when costo_unitario is not null then round(stock_actual * costo_unitario, 2) end
  ) order by nombre), '[]'::jsonb)
  from filas
$$;
