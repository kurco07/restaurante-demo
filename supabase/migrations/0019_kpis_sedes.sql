-- ============================================================
-- Fase 5, Módulo 3 — Vista multi-sede: comparación entre sedes
-- ============================================================
-- Decisiones de Pedro (2026-10-22), ver Registro_de_Cambios.md:
-- - Gerencia elige "Todas las sedes" (consolidado) o una sede, en todo su
--   panel. Eso ya lo soportan kpis_ventas, kpis_inventario,
--   kpis_rentabilidad y reporte_diario con p_sede_id; aquí no cambian.
-- - Costo de un insumo: con una sede elegida, su última compra recibida
--   en ESA sede; en "Todas", la más reciente de cualquier sede. Ya era así
--   desde 0012 y se mantiene.
-- - Página "Sedes": una fila por sede para comparar el mismo período.
--
-- security invoker (el default), igual que el resto de los KPIs: RLS
-- decide qué sedes entran (gerencia: todas las de su restaurante).
--
-- Por sede devuelve, en el período:
-- - ventas, propinas, cuentas, ticket promedio (mismo criterio que
--   kpis_ventas: cuenta cerrada con pago)
-- - platos e importe anulados (por anulado_en)
-- - valor_merma: mermas del período × costo del insumo en esa sede
-- - valor_inventario: stock de hoy × costo del insumo en esa sede, y
--   cuántos insumos con stock no tienen costo (nunca se compraron ahí:
--   no se valorizan, nunca se asume costo 0)

create or replace function public.kpis_sedes(
  p_desde timestamptz,
  p_hasta timestamptz
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with ventas as (
    select
      sm.sede_id,
      sum(pc.monto) as ventas,
      sum(pc.propina) as propinas,
      count(distinct sm.id) as cuentas
    from sesiones_mesa sm
    join pagos_cierre pc on pc.sesion_id = sm.id
    where sm.estado = 'cerrada'
      and sm.cerrada_en >= p_desde
      and sm.cerrada_en < p_hasta
    group by sm.sede_id
  ),
  anulados as (
    select
      pi.sede_id,
      sum(pi.cantidad) as platos,
      sum(pi.cantidad * pi.precio_unitario) as importe
    from pedidos_items pi
    where pi.estado = 'anulado'
      and pi.anulado_en >= p_desde
      and pi.anulado_en < p_hasta
    group by pi.sede_id
  ),
  -- costo_insumo_actual ya trae la última compra por (sede, insumo)
  merma as (
    select
      mo.sede_id,
      sum(mo.cantidad * c.costo_unitario) as valor
    from movimientos_inventario mo
    join costo_insumo_actual c on c.sede_id = mo.sede_id and c.insumo_id = mo.insumo_id
    where mo.tipo = 'merma'
      and mo.fecha >= p_desde
      and mo.fecha < p_hasta
    group by mo.sede_id
  ),
  inventario as (
    select
      inv.sede_id,
      sum(inv.cantidad_actual * c.costo_unitario) as valor,
      count(*) filter (where c.costo_unitario is null) as sin_costo
    from inventario_sede inv
    left join costo_insumo_actual c on c.sede_id = inv.sede_id and c.insumo_id = inv.insumo_id
    where inv.cantidad_actual > 0
    group by inv.sede_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'sede_id', se.id,
    'sede', se.nombre,
    'ventas', coalesce(v.ventas, 0),
    'propinas', coalesce(v.propinas, 0),
    'cuentas', coalesce(v.cuentas, 0),
    'ticket_promedio', case when coalesce(v.cuentas, 0) = 0 then 0 else round(v.ventas / v.cuentas, 2) end,
    'platos_anulados', coalesce(a.platos, 0),
    'importe_anulado', coalesce(a.importe, 0),
    'valor_merma', round(coalesce(m.valor, 0), 2),
    'valor_inventario', round(coalesce(i.valor, 0), 2),
    'insumos_sin_costo', coalesce(i.sin_costo, 0)
  ) order by se.creado_en), '[]'::jsonb)
  from sedes se
  left join ventas v on v.sede_id = se.id
  left join anulados a on a.sede_id = se.id
  left join merma m on m.sede_id = se.id
  left join inventario i on i.sede_id = se.id
$$;

revoke all on function public.kpis_sedes(timestamptz, timestamptz) from public, anon;
grant execute on function public.kpis_sedes(timestamptz, timestamptz) to authenticated;
