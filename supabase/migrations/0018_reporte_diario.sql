-- ============================================================
-- Fase 5, Módulo 2 — Reporte por día (antes "reportes por turno")
-- ============================================================
-- Decisiones de Pedro (2026-10-22), ver Registro_de_Cambios.md:
-- - No hay turnos: el reporte es por día calendario de la sede (en su
--   zona horaria). No se crea tabla de turnos.
-- - Lo ven supervisor y gerencia. Administración no.
-- - El supervisor solo ve el día de HOY y solo de SU sede: ventas, medios
--   de pago, cobros y anulaciones. Sin costos ni rentabilidad.
-- - Gerencia ve cualquier día pasado y el historial día por día, de todas
--   las sedes de su restaurante (o una sola con p_sede_id).
-- - Las anulaciones del día van en el reporte: qué, cuánto, por qué y
--   quién, y si dejaron merma.
--
-- security invoker (el default), igual que kpis_ventas (0010): RLS sigue
-- siendo la barrera entre restaurantes y entre sedes. Además se verifica
-- el rol aquí adentro, porque la política de pagos_cierre deja leer a
-- cualquier usuario de la sede (también a un mesonero o a cocina), así
-- que esconder la pantalla no alcanzaría.
--
-- De dónde sale cada número (mismo criterio que kpis_ventas):
-- - Una venta es una cuenta cerrada con pago: sesiones_mesa 'cerrada' +
--   pagos_cierre. Una mesa liberada por anulación total (0016) se cierra
--   sin pago y no cuenta como venta.
-- - El día de una venta es el de cerrada_en, y el de una anulación el de
--   anulado_en, ambos en la zona horaria de su sede.
-- - ventas = suma de pagos_cierre.monto (sin propina); propinas aparte.

create or replace function public.reporte_diario(
  p_dia date default null,
  p_sede_id uuid default null
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_rol text := public.current_rol();
  v_sede uuid := p_sede_id;
  v_hoy date;
  v_dia date;
begin
  if v_rol is null or v_rol not in ('supervisor', 'gerencia') then
    raise exception 'Solo supervisor o gerencia pueden ver el reporte del día' using errcode = '42501';
  end if;

  -- El supervisor siempre ve su propia sede, pida lo que pida
  if v_rol = 'supervisor' then
    v_sede := public.current_sede_id();
    if v_sede is null then
      raise exception 'Tu usuario no tiene una sede asignada' using errcode = '42501';
    end if;
  end if;

  -- "Hoy" en la zona horaria de la sede. Sin sede (gerencia viendo todas),
  -- la de la primera sede del restaurante.
  select (now() at time zone se.zona_horaria)::date into v_hoy
  from sedes se
  where v_sede is null or se.id = v_sede
  order by se.creado_en
  limit 1;
  v_hoy := coalesce(v_hoy, current_date);
  v_dia := coalesce(p_dia, v_hoy);

  if v_rol = 'supervisor' and v_dia <> v_hoy then
    raise exception 'El supervisor solo puede ver el reporte de hoy' using errcode = '42501';
  end if;

  return (
    with cobros as (
      select
        pc.id,
        sm.id as sesion_id,
        m.nombre_numero as mesa,
        sm.mesonero_id,
        pc.cerrado_por,
        sm.cerrada_en at time zone se.zona_horaria as cerrada_local,
        pc.metodo_de_pago,
        pc.monto,
        pc.propina
      from sesiones_mesa sm
      join pagos_cierre pc on pc.sesion_id = sm.id
      join sedes se on se.id = sm.sede_id
      join mesas m on m.id = sm.mesa_id
      where sm.estado = 'cerrada'
        and (sm.cerrada_en at time zone se.zona_horaria)::date = v_dia
        and (v_sede is null or sm.sede_id = v_sede)
    ),
    anulados as (
      select
        pi.anulado_en at time zone se.zona_horaria as anulado_local,
        m.nombre_numero as mesa,
        mi.nombre as plato,
        pi.cantidad,
        pi.cantidad * pi.precio_unitario as importe,
        pi.motivo_anulacion,
        pi.anulado_desde,
        coalesce(u.nombre, '—') as anulado_por
      from pedidos_items pi
      join sesiones_mesa sm on sm.id = pi.sesion_id
      join sedes se on se.id = pi.sede_id
      join mesas m on m.id = sm.mesa_id
      join menu_items mi on mi.id = pi.menu_item_id
      left join usuarios u on u.id = pi.anulado_por
      where pi.estado = 'anulado'
        and (pi.anulado_en at time zone se.zona_horaria)::date = v_dia
        and (v_sede is null or pi.sede_id = v_sede)
    )
    select jsonb_build_object(
      'dia', v_dia,
      'es_hoy', v_dia = v_hoy,
      'resumen', (
        select jsonb_build_object(
          'ventas', coalesce(sum(monto), 0),
          'propinas', coalesce(sum(propina), 0),
          'total_cobrado', coalesce(sum(monto + propina), 0),
          'cuentas', count(distinct sesion_id),
          'ticket_promedio', case when count(distinct sesion_id) = 0 then 0
                                  else round(sum(monto) / count(distinct sesion_id), 2) end
        )
        from cobros
      ),
      'por_metodo', coalesce((
        select jsonb_agg(jsonb_build_object(
          'metodo', metodo_de_pago, 'ventas', ventas, 'propinas', propinas, 'cuentas', n
        ) order by ventas desc)
        from (
          select metodo_de_pago, sum(monto) as ventas, sum(propina) as propinas, count(distinct sesion_id) as n
          from cobros group by 1
        ) x
      ), '[]'::jsonb),
      'por_mesonero', coalesce((
        select jsonb_agg(jsonb_build_object(
          'mesonero', nombre, 'ventas', ventas, 'propinas', propinas, 'cuentas', n
        ) order by ventas desc)
        from (
          select coalesce(u.nombre, 'Sin mesonero') as nombre, sum(c.monto) as ventas,
                 sum(c.propina) as propinas, count(distinct c.sesion_id) as n
          from cobros c
          left join usuarios u on u.id = c.mesonero_id
          group by 1
        ) x
      ), '[]'::jsonb),
      'cobros', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', c.id,
          'hora', to_char(c.cerrada_local, 'HH24:MI'),
          'mesa', c.mesa,
          'mesonero', coalesce(um.nombre, 'Sin mesonero'),
          'cobrado_por', coalesce(uc.nombre, '—'),
          'metodo', c.metodo_de_pago,
          'monto', c.monto,
          'propina', c.propina
        ) order by c.cerrada_local)
        from cobros c
        left join usuarios um on um.id = c.mesonero_id
        left join usuarios uc on uc.id = c.cerrado_por
      ), '[]'::jsonb),
      'anulaciones', jsonb_build_object(
        'platos', (select coalesce(sum(cantidad), 0) from anulados),
        'importe', (select coalesce(sum(importe), 0) from anulados),
        -- Anulado en preparación o listo: los ingredientes ya se usaron (0015)
        'con_merma', (select count(*) from anulados where anulado_desde in ('en_preparacion', 'listo')),
        'detalle', coalesce((
          select jsonb_agg(jsonb_build_object(
            'hora', to_char(anulado_local, 'HH24:MI'),
            'mesa', mesa,
            'plato', plato,
            'cantidad', cantidad,
            'importe', importe,
            'motivo', motivo_anulacion,
            'anulado_por', anulado_por,
            'anulado_desde', anulado_desde
          ) order by anulado_local)
          from anulados
        ), '[]'::jsonb)
      ),
      -- Solo tiene sentido hoy: mesas que todavía no se cobraron
      'mesas_abiertas', (
        select count(*) from sesiones_mesa sm
        where sm.estado = 'abierta' and (v_sede is null or sm.sede_id = v_sede)
      )
    )
  );
end;
$$;

revoke all on function public.reporte_diario(date, uuid) from public, anon;
grant execute on function public.reporte_diario(date, uuid) to authenticated;

-- Historial día por día para gerencia: un renglón por día del rango
-- (ambos extremos incluidos), también los días sin ventas, del más
-- reciente al más viejo.
create or replace function public.reporte_diario_historial(
  p_desde date,
  p_hasta date,
  p_sede_id uuid default null
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
begin
  if coalesce(public.current_rol(), '') <> 'gerencia' then
    raise exception 'Solo gerencia puede ver el historial de reportes' using errcode = '42501';
  end if;

  return (
    with ventas as (
      select
        (sm.cerrada_en at time zone se.zona_horaria)::date as dia,
        sum(pc.monto) as ventas,
        sum(pc.propina) as propinas,
        count(distinct sm.id) as cuentas
      from sesiones_mesa sm
      join pagos_cierre pc on pc.sesion_id = sm.id
      join sedes se on se.id = sm.sede_id
      where sm.estado = 'cerrada'
        and (sm.cerrada_en at time zone se.zona_horaria)::date between p_desde and p_hasta
        and (p_sede_id is null or sm.sede_id = p_sede_id)
      group by 1
    ),
    anulados as (
      select
        (pi.anulado_en at time zone se.zona_horaria)::date as dia,
        sum(pi.cantidad) as platos,
        sum(pi.cantidad * pi.precio_unitario) as importe
      from pedidos_items pi
      join sedes se on se.id = pi.sede_id
      where pi.estado = 'anulado'
        and (pi.anulado_en at time zone se.zona_horaria)::date between p_desde and p_hasta
        and (p_sede_id is null or pi.sede_id = p_sede_id)
      group by 1
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'dia', d.dia,
      'ventas', coalesce(v.ventas, 0),
      'propinas', coalesce(v.propinas, 0),
      'cuentas', coalesce(v.cuentas, 0),
      'platos_anulados', coalesce(a.platos, 0),
      'importe_anulado', coalesce(a.importe, 0)
    ) order by d.dia desc), '[]'::jsonb)
    from (select generate_series(p_desde, p_hasta, interval '1 day')::date as dia) d
    left join ventas v on v.dia = d.dia
    left join anulados a on a.dia = d.dia
  );
end;
$$;

revoke all on function public.reporte_diario_historial(date, date, uuid) from public, anon;
grant execute on function public.reporte_diario_historial(date, date, uuid) to authenticated;
