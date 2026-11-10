-- ============================================================
-- Fase 8, Módulo 3 — Cada dispositivo guarda solo lo reciente
-- ============================================================
-- Decisión de Pedro (2026-11-09): las tablets y celulares de mesonero y
-- cocina guardan solo las cuentas abiertas y lo de los últimos 2 días.
-- Hoy PowerSync les manda TODO el historial del restaurante, y con meses
-- de uso eso vuelve lenta la primera sincronización y las consultas en
-- equipos de gama baja. El historial completo lo siguen leyendo gerencia
-- y los reportes directo del servidor: esto no borra nada.
--
-- Cómo funciona: las reglas de sincronización de PowerSync no pueden usar
-- now() (evalúan una fila solo cuando la fila cambia). Por eso:
-- 1. sesiones_mesa.archivada_en y pedidos_items.archivado_en: nulo = la
--    fila se sincroniza a los dispositivos; con fecha = solo queda en el
--    servidor.
-- 2. archivar_historial() marca las cuentas CERRADAS de hace más de 2 días
--    y sus platos. Una cuenta abierta nunca se archiva.
-- 3. pg_cron la corre todos los días a las 4 a. m. de Venezuela.
-- 4. Las reglas de PowerSync filtran "archivada_en is null"
--    (docs/Supabase_PowerSync_Setup_Comandos.md). Cuando una fila se
--    archiva, PowerSync la borra sola de los dispositivos.
--
-- Revisado antes de escribir esto: los triggers de update de pedidos_items
-- y sesiones_mesa (inventario, anulaciones, merma, liberar mesa,
-- transferencia, fusión) solo actúan si cambia el estado, el mesonero o
-- fusionada_en. Marcar archivado no dispara ninguno.

alter table public.sesiones_mesa add column archivada_en timestamptz;
alter table public.pedidos_items add column archivado_en timestamptz;

comment on column public.sesiones_mesa.archivada_en is
  'Si no es nulo, la cuenta es historial: ya no se sincroniza a los dispositivos (PowerSync). Ver archivar_historial().';
comment on column public.pedidos_items.archivado_en is
  'Si no es nulo, el plato es historial: ya no se sincroniza a los dispositivos (PowerSync). Ver archivar_historial().';

-- Para que el proceso diario encuentre rápido lo que le toca
create index if not exists sesiones_mesa_por_archivar_idx
  on public.sesiones_mesa (cerrada_en)
  where archivada_en is null and estado = 'cerrada';
create index if not exists pedidos_items_sesion_idx
  on public.pedidos_items (sesion_id);

-- ------------------------------------------------------------
-- Archiva las cuentas cerradas de hace más de p_dias días, y sus platos
-- ------------------------------------------------------------
create or replace function public.archivar_historial(p_dias integer default 2)
returns table (cuentas_archivadas integer, platos_archivados integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cuentas integer;
  v_platos integer;
begin
  update sesiones_mesa
     set archivada_en = now()
   where estado = 'cerrada'
     and archivada_en is null
     and coalesce(cerrada_en, abierta_en) < now() - make_interval(days => p_dias);
  get diagnostics v_cuentas = row_count;

  -- Los platos de toda cuenta archivada, también los que llegaron tarde
  -- (un dispositivo que estuvo días sin internet y subió después)
  update pedidos_items pi
     set archivado_en = now()
    from sesiones_mesa s
   where s.id = pi.sesion_id
     and s.archivada_en is not null
     and pi.archivado_en is null;
  get diagnostics v_platos = row_count;

  return query select v_cuentas, v_platos;
end;
$$;

-- Solo la corre el proceso programado (o alguien desde el SQL Editor)
revoke execute on function public.archivar_historial(integer) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Todos los días a las 08:00 UTC = 4:00 a. m. en Venezuela (UTC-4),
-- cuando no hay servicio
-- ------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'archivar-historial-diario',
  '0 8 * * *',
  $$select public.archivar_historial()$$
);

-- La primera vez se corre ya, para archivar lo viejo que hay hoy
select * from public.archivar_historial();
