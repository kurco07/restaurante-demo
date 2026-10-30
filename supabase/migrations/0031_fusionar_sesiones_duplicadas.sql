-- ============================================================
-- Fase 8, Módulo 1 — Una sola cuenta abierta por mesa, aunque se haya
-- trabajado sin internet
-- ============================================================
-- El riesgo (arquitectura.md §4.11, "qué pasa si dos dispositivos
-- modifican el mismo pedido mientras están offline"): nada impedía que una
-- mesa tuviera DOS sesiones abiertas. Pasa cuando:
-- - dos mesoneros sin internet abren la misma mesa, o
-- - un mesonero sin internet abre la mesa mientras el cliente ya pidió por
--   QR con los datos de su celular.
-- Al volver la conexión, PowerSync sube la segunda sesión y la cuenta
-- queda partida en dos: platos repartidos y cobro incompleto.
--
-- Decisión de Pedro (2026-10-30): fusionarlas solas. Cuando llega una
-- sesión abierta para una mesa que ya tiene otra abierta, la nueva nace
-- cerrada y apuntando a la que ya estaba (fusionada_en), y todo plato que
-- llegue para la sesión fusionada se guarda en la que sobrevive. Nada se
-- pierde y queda registro de la fusión.
--
-- Por qué así y no rechazando la segunda: si la base la rechazara, el
-- conector de PowerSync descarta el cambio (P0001) y los platos de ese
-- dispositivo, que apuntan a esa sesión, quedarían huérfanos. Fusionar
-- conserva todo.
--
-- Los triggers corren como security definer: tienen que ver las sesiones
-- aunque las haya abierto otro usuario. Un candado por mesa
-- (pg_advisory_xact_lock) evita que dos subidas simultáneas abran dos.

alter table public.sesiones_mesa
  add column fusionada_en uuid references public.sesiones_mesa(id);

comment on column public.sesiones_mesa.fusionada_en is
  'Si no es nulo, esta sesión se abrió duplicada (offline) y se fusionó en esa otra: sus platos están allá.';

-- ------------------------------------------------------------
-- 1. Al llegar una sesión abierta duplicada, se fusiona en la existente
-- ------------------------------------------------------------
create or replace function public.fusionar_sesion_duplicada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existente sesiones_mesa;
begin
  if new.estado <> 'abierta' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('sesion_mesa:' || new.mesa_id::text));

  select * into v_existente
  from sesiones_mesa
  where mesa_id = new.mesa_id and estado = 'abierta' and id <> new.id
  order by abierta_en asc
  limit 1;

  if v_existente.id is null then
    return new;
  end if;

  -- La que llega tarde nace cerrada y apunta a la que sobrevive
  new.estado := 'cerrada';
  new.cerrada_en := now();
  new.fusionada_en := v_existente.id;

  -- La que sobrevive se queda con el mesonero si no tenía (p. ej. la abrió
  -- el cliente por QR) y pasa a 'hibrido' si las abrieron orígenes distintos
  update sesiones_mesa
     set mesonero_id = coalesce(mesonero_id, new.mesonero_id),
         origen = case when origen <> new.origen then 'hibrido' else origen end
   where id = v_existente.id;

  return new;
end;
$$;

drop trigger if exists sesiones_mesa_fusionar_duplicada on public.sesiones_mesa;
create trigger sesiones_mesa_fusionar_duplicada
  before insert on public.sesiones_mesa
  for each row execute function public.fusionar_sesion_duplicada();

-- ------------------------------------------------------------
-- 2. Los platos de una sesión fusionada van a la que sobrevive
-- ------------------------------------------------------------
-- Cubre los que suben después de la sesión (lo normal: PowerSync sube en
-- orden, primero la sesión y después sus platos) y, por si acaso, también
-- los que ya estaban. Se sigue la cadena por si la sobreviviente también
-- se fusionó después.
create or replace function public.redirigir_plato_a_sesion_viva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_destino uuid;
  v_saltos integer := 0;
begin
  select fusionada_en into v_destino from sesiones_mesa where id = new.sesion_id;
  while v_destino is not null and v_saltos < 5 loop
    new.sesion_id := v_destino;
    select fusionada_en into v_destino from sesiones_mesa where id = new.sesion_id;
    v_saltos := v_saltos + 1;
  end loop;
  return new;
end;
$$;

drop trigger if exists pedidos_items_redirigir_a_sesion_viva on public.pedidos_items;
create trigger pedidos_items_redirigir_a_sesion_viva
  before insert on public.pedidos_items
  for each row execute function public.redirigir_plato_a_sesion_viva();

-- Platos que ya estaban en la sesión antes de que se fusionara (caso raro:
-- solo si la fusión ocurre por un update, no por el insert de arriba)
create or replace function public.mover_platos_de_sesion_fusionada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fusionada_en is not null and old.fusionada_en is null then
    update pedidos_items set sesion_id = new.fusionada_en where sesion_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sesiones_mesa_mover_platos_fusionada on public.sesiones_mesa;
create trigger sesiones_mesa_mover_platos_fusionada
  after update on public.sesiones_mesa
  for each row execute function public.mover_platos_de_sesion_fusionada();

-- ------------------------------------------------------------
-- 3. Una sesión fusionada no se puede volver a abrir
-- ------------------------------------------------------------
-- El dispositivo que la abrió offline puede seguir mandando cambios sobre
-- ella hasta que se entere de la fusión; ninguno la reabre.
create or replace function public.validar_sesion_fusionada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.fusionada_en is not null then
    new.estado := 'cerrada';
    new.fusionada_en := old.fusionada_en;
  end if;
  return new;
end;
$$;

drop trigger if exists sesiones_mesa_validar_fusionada on public.sesiones_mesa;
create trigger sesiones_mesa_validar_fusionada
  before update on public.sesiones_mesa
  for each row execute function public.validar_sesion_fusionada();
