-- ============================================================
-- Fase 8, Módulo 4 — Medición del piloto (docs/Plan_Piloto_Roof.md)
-- ============================================================
-- NO es una migración: solo LEE, no cambia nada. Se corre en el SQL
-- Editor de Supabase durante el piloto (por ejemplo, una vez por día) y
-- al terminar.
--
-- Cómo usarlo:
-- 1. Corre primero el BLOQUE 0 para sacar el id de la sede del piloto.
-- 2. En los demás bloques, cambia:
--      'PEGA-AQUI-EL-ID-DE-LA-SEDE'  → el id de la sede del piloto
--      '2026-12-01 00:00'            → el día y la hora de inicio del piloto
--    (aparecen en el `with p as (...)` del principio de cada bloque).
-- 3. El SQL Editor muestra solo el resultado de la ÚLTIMA consulta: para
--    cada bloque, selecciónalo con el mouse y usa "Run selected".
--
-- Las horas se muestran en hora de Venezuela (America/Caracas).
-- Los bloques 2 a 6 tienen que salir VACÍOS: si sale algo, es un pedido
-- con un problema que hay que revisar.

-- ------------------------------------------------------------
-- 0. Buscar la sede del piloto (copiar su id)
-- ------------------------------------------------------------
select t.nombre as restaurante, s.nombre as sede, s.id as id_de_la_sede
from sedes s join tenants t on t.id = s.tenant_id
order by t.nombre, s.nombre;

-- ============================================================
-- PEDIDOS SIN ERRORES (bloques 1 a 6)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Resumen por día: cuentas, platos y cobros (informativo)
-- ------------------------------------------------------------
-- "cuentas_sin_cobro" debería ser 0 todos los días (excepto cuentas
-- todavía abiertas, que se cuentan aparte).
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede, timestamptz '2026-12-01 00:00 America/Caracas' as desde),
cuentas as (
  select s.*, (s.abierta_en at time zone 'America/Caracas')::date as dia,
         pc.monto, pc.propina, pc.sesion_id is not null as cobrada
  from sesiones_mesa s
  join p on s.sede_id = p.sede and s.abierta_en >= p.desde
  left join pagos_cierre pc on pc.sesion_id = s.id
)
select dia,
       count(*) as cuentas,
       count(*) filter (where estado = 'abierta') as todavia_abiertas,
       count(*) filter (where estado = 'cerrada' and fusionada_en is null and not cobrada) as cuentas_sin_cobro,
       count(*) filter (where fusionada_en is not null) as cuentas_unidas_sin_internet,
       coalesce(sum(monto), 0) as total_cobrado,
       coalesce(sum(propina), 0) as propinas
from cuentas
group by dia
order by dia;

-- ------------------------------------------------------------
-- 2. Cuentas cerradas SIN cobro → debe salir vacío
-- ------------------------------------------------------------
-- Una cuenta que se cerró sin registrar el pago. Las unidas sin internet
-- (fusionada_en) no cuentan: sus platos se cobran en la otra cuenta.
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede, timestamptz '2026-12-01 00:00 America/Caracas' as desde)
select m.nombre_numero as mesa,
       s.abierta_en at time zone 'America/Caracas' as abierta,
       s.cerrada_en at time zone 'America/Caracas' as cerrada,
       count(pi.id) filter (where pi.estado <> 'anulado') as platos_sin_anular
from sesiones_mesa s, p, mesas m, pedidos_items pi
where s.sede_id = p.sede and s.abierta_en >= p.desde
  and m.id = s.mesa_id and pi.sesion_id = s.id
  and s.estado = 'cerrada' and s.fusionada_en is null
  and not exists (select 1 from pagos_cierre pc where pc.sesion_id = s.id)
group by m.nombre_numero, s.abierta_en, s.cerrada_en
having count(pi.id) filter (where pi.estado <> 'anulado') > 0
order by s.abierta_en;

-- ------------------------------------------------------------
-- 3. Cobros que no coinciden con lo pedido → debe salir vacío
-- ------------------------------------------------------------
-- Compara lo cobrado (sin propina) con la suma de los platos no anulados.
-- Una diferencia puede ser un descuento hecho a mano, o un plato que se
-- olvidó o se cobró de más: revisarlo con el mesonero.
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede, timestamptz '2026-12-01 00:00 America/Caracas' as desde),
pedido as (
  select pi.sesion_id, sum(pi.cantidad * pi.precio_unitario) as total_platos
  from pedidos_items pi
  where pi.estado <> 'anulado'
  group by pi.sesion_id
)
select m.nombre_numero as mesa,
       s.cerrada_en at time zone 'America/Caracas' as cerrada,
       pd.total_platos, pc.monto as cobrado, pc.monto - pd.total_platos as diferencia,
       pc.metodo_de_pago, u.nombre as cobro
from sesiones_mesa s
join p on s.sede_id = p.sede and s.abierta_en >= p.desde
join mesas m on m.id = s.mesa_id
join pagos_cierre pc on pc.sesion_id = s.id
join pedido pd on pd.sesion_id = s.id
left join usuarios u on u.id = pc.cerrado_por
where abs(pc.monto - pd.total_platos) >= 0.01
order by s.cerrada_en;

-- ------------------------------------------------------------
-- 4. Mesas con MÁS DE UNA cuenta abierta → debe salir vacío
-- ------------------------------------------------------------
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede)
select m.nombre_numero as mesa, count(*) as cuentas_abiertas
from sesiones_mesa s join p on s.sede_id = p.sede
join mesas m on m.id = s.mesa_id
where s.estado = 'abierta'
group by m.nombre_numero
having count(*) > 1;

-- ------------------------------------------------------------
-- 5. Posibles platos DUPLICADOS → debe salir vacío
-- ------------------------------------------------------------
-- Mismo plato, misma cuenta, misma persona y misma cantidad con menos de
-- 5 segundos de diferencia. Puede ser legítimo (dos iguales seguidos):
-- revisarlos uno por uno.
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede, timestamptz '2026-12-01 00:00 America/Caracas' as desde)
select m.nombre_numero as mesa, mi.nombre as plato, a.cantidad,
       coalesce(u.nombre, 'Cliente (QR)') as quien,
       a.creado_en at time zone 'America/Caracas' as primero,
       b.creado_en at time zone 'America/Caracas' as segundo
from pedidos_items a
join p on a.sede_id = p.sede and a.creado_en >= p.desde
join pedidos_items b
  on b.sesion_id = a.sesion_id and b.menu_item_id = a.menu_item_id and b.cantidad = a.cantidad
 and b.agregado_por is not distinct from a.agregado_por and b.id <> a.id
 and b.creado_en >= a.creado_en and extract(epoch from b.creado_en - a.creado_en) < 5
join sesiones_mesa s on s.id = a.sesion_id
join mesas m on m.id = s.mesa_id
join menu_items mi on mi.id = a.menu_item_id
left join usuarios u on u.id = a.agregado_por
where a.id < b.id;

-- ------------------------------------------------------------
-- 6. Platos atascados → debe salir vacío al final del día
-- ------------------------------------------------------------
-- Pedidos por QR que nadie aprobó, o platos que siguen en cocina, en
-- cuentas de hace más de 3 horas.
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede, timestamptz '2026-12-01 00:00 America/Caracas' as desde)
select m.nombre_numero as mesa, mi.nombre as plato, pi.estado,
       pi.creado_en at time zone 'America/Caracas' as pedido_a_las
from pedidos_items pi
join p on pi.sede_id = p.sede and pi.creado_en >= p.desde
join sesiones_mesa s on s.id = pi.sesion_id
join mesas m on m.id = s.mesa_id
join menu_items mi on mi.id = pi.menu_item_id
where pi.estado in ('por_aprobar', 'pendiente', 'en_preparacion', 'listo')
  and pi.creado_en < now() - interval '3 hours'
order by pi.creado_en;

-- ============================================================
-- USO REAL DE LA APP (bloques 7 a 10)
-- ============================================================

-- ------------------------------------------------------------
-- 7. Pedidos por QR contra pedidos del mesonero, por día
-- ------------------------------------------------------------
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede, timestamptz '2026-12-01 00:00 America/Caracas' as desde)
select (pi.creado_en at time zone 'America/Caracas')::date as dia,
       count(*) as platos,
       count(*) filter (where pi.agregado_por is null) as por_qr,
       count(*) filter (where pi.agregado_por is not null) as por_mesonero,
       round(100.0 * count(*) filter (where pi.agregado_por is null) / nullif(count(*), 0), 1) as porcentaje_qr,
       count(*) filter (where pi.estado = 'anulado') as anulados
from pedidos_items pi, p
where pi.sede_id = p.sede and pi.creado_en >= p.desde
group by 1
order by 1;

-- ------------------------------------------------------------
-- 8. Mesas atendidas por día y cómo se abrieron
-- ------------------------------------------------------------
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede, timestamptz '2026-12-01 00:00 America/Caracas' as desde)
select (s.abierta_en at time zone 'America/Caracas')::date as dia,
       count(distinct s.mesa_id) as mesas_distintas,
       count(*) filter (where s.fusionada_en is null) as cuentas,
       count(*) filter (where s.origen = 'mesonero') as abiertas_por_mesonero,
       count(*) filter (where s.origen = 'autopedido') as abiertas_por_qr,
       count(*) filter (where s.origen = 'hibrido') as mesonero_y_qr,
       round(avg(extract(epoch from s.cerrada_en - s.abierta_en) / 60)
             filter (where s.estado = 'cerrada' and s.fusionada_en is null)) as minutos_promedio_por_mesa
from sesiones_mesa s, p
where s.sede_id = p.sede and s.abierta_en >= p.desde
group by 1
order by 1;

-- ------------------------------------------------------------
-- 9. ¿El personal usa la app todo el turno? Actividad por persona y hora
-- ------------------------------------------------------------
-- Cuántos platos cargó cada persona en cada hora del día. Huecos largos
-- en medio del servicio pueden querer decir que volvieron al papel.
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede, timestamptz '2026-12-01 00:00 America/Caracas' as desde)
select (pi.creado_en at time zone 'America/Caracas')::date as dia,
       extract(hour from pi.creado_en at time zone 'America/Caracas') as hora,
       coalesce(u.nombre, 'Cliente (QR)') as quien,
       count(*) as platos
from pedidos_items pi
join p on pi.sede_id = p.sede and pi.creado_en >= p.desde
left join usuarios u on u.id = pi.agregado_por
group by 1, 2, 3
order by 1, 2, 3;

-- ------------------------------------------------------------
-- 10. Anulaciones y sus motivos
-- ------------------------------------------------------------
with p as (select 'PEGA-AQUI-EL-ID-DE-LA-SEDE'::uuid as sede, timestamptz '2026-12-01 00:00 America/Caracas' as desde)
select coalesce(pi.motivo_anulacion, '(sin motivo)') as motivo,
       count(*) as platos, sum(pi.cantidad * pi.precio_unitario) as valor,
       count(*) filter (where pi.anulado_desde in ('en_preparacion', 'listo')) as ya_estaban_en_cocina
from pedidos_items pi, p
where pi.sede_id = p.sede and pi.creado_en >= p.desde and pi.estado = 'anulado'
group by 1
order by 2 desc;

-- ============================================================
-- Inventario que cuadra: no es una consulta. Se compara el conteo físico
-- del día de inicio con el del final, en Administración → Inventario →
-- Conteo físico (la app muestra la diferencia contra lo que calculó).
-- Tiempos de cocina: la base no guarda la hora de cada cambio de estado
-- (solo cuándo se pidió el plato), así que esto no se puede medir con
-- consultas; si hace falta, se toma a mano durante el piloto.
-- ============================================================
