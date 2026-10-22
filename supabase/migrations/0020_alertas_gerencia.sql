-- ============================================================
-- Fase 5, Módulo 4 — Alertas y excepciones para gerencia
-- ============================================================
-- Decisiones de Pedro (2026-10-22), ver Registro_de_Cambios.md y el
-- Roadmap (Fase 5, Módulo 4):
-- - Solo gerencia las ve (se verifica aquí adentro).
-- - Umbrales fijos (configurables por restaurante queda para la Fase 7).
-- - Solo se muestran: se calculan al momento, sin tabla ni estado de
--   "revisada".
-- - Entran estas seis; "muchas anulaciones de una persona" NO entra, y
--   los descuentos no existen en el MVP:
--
--   merma_alta        Merma de los últimos 7 días, en $, más de 50% sobre
--                     el promedio semanal de las 4 semanas anteriores, o
--                     más del 3% de las ventas de esos 7 días.
--   anulacion_preparada  Platos anulados en preparación o listos (ya
--                     gastaron ingredientes) por más de $15 en un día.
--                     Últimos 7 días.
--   conteo_faltante   Un conteo físico que encontró menos de lo registrado
--                     por más del 10% del stock teórico o más de $20.
--                     Últimos 7 días.
--   margen_negativo   Plato vendido en los últimos 30 días que cuesta más
--                     de lo que se cobra (solo platos con costo completo).
--   ventas_caidas     Un día de los últimos 7 (sin hoy, que no terminó)
--                     con menos del 60% del promedio del mismo día de la
--                     semana en las 4 semanas anteriores (se exige que al
--                     menos 2 de esas 4 hayan tenido ventas).
--   stock_bajo        Insumo por debajo de su stock_minimo en una sede.
--
-- Gravedad (para ordenar, la más grave primero): 'alta' para un plato con
-- margen negativo, un insumo agotado, y una merma que cumple los dos
-- criterios a la vez; 'media' para el resto.
--
-- Costo de los insumos, igual que kpis_sedes (0019): la última compra
-- recibida en la sede del movimiento; si en esa sede nunca se compró, la
-- más reciente de cualquier sede. Un insumo nunca comprado no suma a la
-- merma en $ (nunca se asume costo 0).
--
-- Un conteo físico con faltante se registra como 'merma' con la
-- referencia "Conteo físico — <fecha>: teórico X <u>, contado Y <u>"
-- (useConteoFisico.ts); de ahí sale el stock teórico para el porcentaje.
--
-- Las fechas por día van en la zona horaria de cada sede. security
-- invoker (el default): RLS sigue separando restaurantes.

create or replace function public.alertas_gerencia(p_sede_id uuid default null)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
begin
  if coalesce(public.current_rol(), '') <> 'gerencia' then
    raise exception 'Solo gerencia puede ver las alertas' using errcode = '42501';
  end if;

  return (
    with sedes_f as (
      select id, nombre, zona_horaria, (now() at time zone zona_horaria)::date as hoy
      from sedes
      where p_sede_id is null or id = p_sede_id
    ),
    costo_cualquiera as (
      select distinct on (insumo_id) insumo_id, costo_unitario
      from costo_insumo_actual
      order by insumo_id, comprado_en desc
    ),
    mermas as (
      select
        mo.sede_id,
        mo.fecha,
        mo.cantidad,
        mo.referencia,
        i.nombre as insumo,
        i.unidad_de_medida as unidad,
        mo.cantidad * coalesce(cs.costo_unitario, cc.costo_unitario) as valor
      from movimientos_inventario mo
      join sedes_f s on s.id = mo.sede_id
      join insumos i on i.id = mo.insumo_id
      left join costo_insumo_actual cs on cs.sede_id = mo.sede_id and cs.insumo_id = mo.insumo_id
      left join costo_cualquiera cc on cc.insumo_id = mo.insumo_id
      where mo.tipo = 'merma'
        and mo.fecha >= now() - interval '35 days'
    ),
    ventas_dia as (
      select sm.sede_id, (sm.cerrada_en at time zone s.zona_horaria)::date as dia, sum(pc.monto) as ventas
      from sesiones_mesa sm
      join pagos_cierre pc on pc.sesion_id = sm.id
      join sedes_f s on s.id = sm.sede_id
      where sm.estado = 'cerrada'
        and sm.cerrada_en >= now() - interval '40 days'
      group by 1, 2
    ),
    alertas as (
      -- 1. Merma alta
      select
        'merma_alta' as tipo,
        case when x.prom > 0 and x.actual > x.prom * 1.5 and x.ventas > 0 and x.actual > x.ventas * 0.03
             then 'alta' else 'media' end as gravedad,
        x.sede_id,
        null::date as fecha,
        jsonb_build_object(
          'merma', round(x.actual, 2),
          'promedio_semanal', round(x.prom, 2),
          'ventas', round(x.ventas, 2),
          'pct_sobre_promedio', case when x.prom > 0 then round((x.actual / x.prom - 1) * 100, 1) end,
          'pct_de_ventas', case when x.ventas > 0 then round(x.actual / x.ventas * 100, 1) end
        ) as datos
      from (
        select
          s.id as sede_id,
          coalesce((select sum(valor) from mermas m where m.sede_id = s.id and m.fecha >= now() - interval '7 days'), 0) as actual,
          coalesce((select sum(valor) from mermas m where m.sede_id = s.id and m.fecha < now() - interval '7 days'), 0) / 4 as prom,
          coalesce((
            select sum(pc.monto) from sesiones_mesa sm join pagos_cierre pc on pc.sesion_id = sm.id
            where sm.sede_id = s.id and sm.estado = 'cerrada' and sm.cerrada_en >= now() - interval '7 days'
          ), 0) as ventas
        from sedes_f s
      ) x
      where x.actual > 0
        and ((x.prom > 0 and x.actual > x.prom * 1.5) or (x.ventas > 0 and x.actual > x.ventas * 0.03))

      union all

      -- 3. Anulación de platos ya preparados
      select
        'anulacion_preparada', 'media', a.sede_id, a.dia,
        jsonb_build_object(
          'platos', a.platos,
          'importe', round(a.importe, 2),
          'anularon', a.anularon
        )
      from (
        select
          pi.sede_id,
          (pi.anulado_en at time zone s.zona_horaria)::date as dia,
          sum(pi.cantidad) as platos,
          sum(pi.cantidad * pi.precio_unitario) as importe,
          string_agg(distinct coalesce(u.nombre, '—'), ', ') as anularon
        from pedidos_items pi
        join sedes_f s on s.id = pi.sede_id
        left join usuarios u on u.id = pi.anulado_por
        where pi.estado = 'anulado'
          and pi.anulado_desde in ('en_preparacion', 'listo')
          and (pi.anulado_en at time zone s.zona_horaria)::date >= s.hoy - 6
        group by 1, 2
      ) a
      where a.importe > 15

      union all

      -- 4. Faltante en conteo físico
      select
        'conteo_faltante', 'media', c.sede_id, (c.fecha at time zone s.zona_horaria)::date,
        jsonb_build_object(
          'insumo', c.insumo,
          'unidad', c.unidad,
          'faltante', c.cantidad,
          'teorico', c.teorico,
          'pct', case when c.teorico > 0 then round(c.cantidad / c.teorico * 100, 1) end,
          'valor', round(c.valor, 2)
        )
      from (
        select m.*, substring(m.referencia from 'teórico ([0-9]+(?:\.[0-9]+)?)')::numeric as teorico
        from mermas m
        where m.referencia like 'Conteo físico%'
          and m.fecha >= now() - interval '7 days'
      ) c
      join sedes_f s on s.id = c.sede_id
      where c.valor > 20 or (c.teorico > 0 and c.cantidad / c.teorico > 0.10)

      union all

      -- 5. Plato con margen negativo (en la sede elegida, o en todas)
      select
        'margen_negativo', 'alta', p_sede_id, null::date,
        jsonb_build_object(
          'plato', e->>'plato',
          'precio_promedio', (e->>'precio_promedio')::numeric,
          'costo_unitario', (e->>'costo_unitario')::numeric,
          'margen_unitario', (e->>'margen_unitario')::numeric,
          'vendidos', (e->>'vendidos')::numeric,
          'ganancia', (e->>'ganancia')::numeric
        )
      from jsonb_array_elements(public.kpis_rentabilidad(now() - interval '30 days', now(), p_sede_id)) e
      where e->>'estado' = 'ok' and (e->>'margen_unitario')::numeric < 0

      union all

      -- 6. Ventas caídas
      select
        'ventas_caidas', 'media', v.sede_id, v.dia,
        jsonb_build_object(
          'ventas', round(v.ventas, 2),
          'promedio', round(v.promedio, 2),
          'pct', round(v.ventas / v.promedio * 100, 1)
        )
      from (
        select
          d.sede_id,
          d.dia,
          coalesce(max(dv.ventas), 0) as ventas,
          avg(coalesce(r.ventas, 0)) as promedio,
          count(r.ventas) as semanas_con_ventas
        from (select s.id as sede_id, s.hoy - g as dia from sedes_f s, generate_series(1, 7) g) d
        left join ventas_dia dv on dv.sede_id = d.sede_id and dv.dia = d.dia
        cross join generate_series(1, 4) w
        left join ventas_dia r on r.sede_id = d.sede_id and r.dia = d.dia - 7 * w
        group by d.sede_id, d.dia
      ) v
      where v.semanas_con_ventas >= 2
        and v.promedio > 0
        and v.ventas < v.promedio * 0.6

      union all

      -- 7. Stock bajo mínimo
      select
        'stock_bajo',
        case when inv.cantidad_actual <= 0 then 'alta' else 'media' end,
        inv.sede_id, null::date,
        jsonb_build_object(
          'insumo', i.nombre,
          'unidad', i.unidad_de_medida,
          'cantidad', inv.cantidad_actual,
          'minimo', inv.stock_minimo
        )
      from inventario_sede inv
      join sedes_f s on s.id = inv.sede_id
      join insumos i on i.id = inv.insumo_id
      where inv.stock_minimo is not null
        and inv.cantidad_actual < inv.stock_minimo
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'tipo', a.tipo,
      'gravedad', a.gravedad,
      'sede_id', a.sede_id,
      'sede', se.nombre,
      'fecha', a.fecha,
      'datos', a.datos
    ) order by a.gravedad = 'alta' desc, a.fecha desc nulls first, a.tipo), '[]'::jsonb)
    from alertas a
    left join sedes se on se.id = a.sede_id
  );
end;
$$;

revoke all on function public.alertas_gerencia(uuid) from public, anon;
grant execute on function public.alertas_gerencia(uuid) to authenticated;
