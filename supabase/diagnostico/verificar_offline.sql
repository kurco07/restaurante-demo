-- ============================================================
-- Fase 8, Módulo 1 — Verificación después de una prueba offline
-- ============================================================
-- NO es una migración: solo LEE, no cambia nada. Se corre en el SQL
-- Editor de Supabase al terminar una prueba de docs/Pruebas_Offline_Fase8.md.
--
-- Cómo usarlo:
-- 1. Cambia la hora de inicio de la prueba ('2026-10-30 15:00') en los
--    bloques que la tienen.
-- 2. El SQL Editor muestra solo el resultado de la ÚLTIMA consulta: para
--    cada bloque, selecciónalo con el mouse y usa "Run selected" (o
--    Ctrl + Enter con el texto seleccionado).
-- 3. Los bloques 1, 3 y 4 tienen que salir VACÍOS. El 2 y el 5 son
--    informativos.

-- ------------------------------------------------------------
-- 1. Mesas con MÁS DE UNA cuenta abierta → debe salir vacío
-- ------------------------------------------------------------
-- Desde la migración 0031 la base las fusiona sola; si sale algo, la
-- fusión no funcionó.
select m.nombre_numero as mesa, count(*) as cuentas_abiertas
from sesiones_mesa s
join mesas m on m.id = s.mesa_id
where s.estado = 'abierta'
group by m.nombre_numero
having count(*) > 1;

-- ------------------------------------------------------------
-- 2. Cuentas que se fusionaron durante la prueba (informativo)
-- ------------------------------------------------------------
select m.nombre_numero as mesa, coalesce(u.nombre, 'Cliente (QR)') as la_abrio,
       s.abierta_en, s.fusionada_en as se_fusiono_en_la_sesion
from sesiones_mesa s
join mesas m on m.id = s.mesa_id
left join usuarios u on u.id = s.mesonero_id
where s.fusionada_en is not null
  and s.abierta_en >= timestamptz '2026-10-30 15:00 America/Caracas'
order by s.abierta_en;

-- ------------------------------------------------------------
-- 3. Platos que quedaron en una cuenta fusionada → debe salir vacío
-- ------------------------------------------------------------
select m.nombre_numero as mesa, mi.nombre as plato, pi.creado_en
from pedidos_items pi
join sesiones_mesa s on s.id = pi.sesion_id
join mesas m on m.id = s.mesa_id
join menu_items mi on mi.id = pi.menu_item_id
where s.fusionada_en is not null;

-- ------------------------------------------------------------
-- 4. Posibles platos DUPLICADOS → debe salir vacío
-- ------------------------------------------------------------
-- Mismo plato, misma cuenta, misma persona y misma cantidad, con menos de
-- 5 segundos de diferencia. En un servicio real puede ser legítimo (dos
-- iguales seguidos); en la prueba, revisarlos uno por uno.
select m.nombre_numero as mesa, mi.nombre as plato, a.cantidad,
       coalesce(u.nombre, 'Cliente (QR)') as quien, a.creado_en as primero, b.creado_en as segundo
from pedidos_items a
join pedidos_items b
  on b.sesion_id = a.sesion_id and b.menu_item_id = a.menu_item_id and b.cantidad = a.cantidad
 and b.agregado_por is not distinct from a.agregado_por and b.id <> a.id and b.creado_en >= a.creado_en
 and extract(epoch from b.creado_en - a.creado_en) < 5
join sesiones_mesa s on s.id = a.sesion_id
join mesas m on m.id = s.mesa_id
join menu_items mi on mi.id = a.menu_item_id
left join usuarios u on u.id = a.agregado_por
where a.creado_en >= timestamptz '2026-10-30 15:00 America/Caracas'
  and a.id < b.id;

-- ------------------------------------------------------------
-- 5. Resumen de la prueba, para comparar con la hoja anotada
-- ------------------------------------------------------------
-- Cuántos platos cargó cada persona (o el cliente por QR) en cada mesa y
-- en qué estado quedaron. Tiene que coincidir con lo anotado.
select m.nombre_numero as mesa, coalesce(u.nombre, 'Cliente (QR)') as quien,
       count(*) as platos, sum(pi.cantidad) as unidades,
       string_agg(distinct pi.estado, ', ') as estados
from pedidos_items pi
join sesiones_mesa s on s.id = pi.sesion_id
join mesas m on m.id = s.mesa_id
left join usuarios u on u.id = pi.agregado_por
where pi.creado_en >= timestamptz '2026-10-30 15:00 America/Caracas'
group by m.nombre_numero, coalesce(u.nombre, 'Cliente (QR)')
order by m.nombre_numero, quien;
