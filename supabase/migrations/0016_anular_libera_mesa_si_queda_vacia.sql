-- ============================================================
-- Si se anulan TODOS los platos activos de una mesa (no queda nada
-- pendiente, en preparación, listo ni entregado — todo anulado), la
-- mesa vuelve sola a 'libre', como si nunca se hubiera pedido nada.
-- Decisión del usuario (2026-10-16): a diferencia del cierre normal
-- (cobrar y cerrar cuenta → 'por_limpiar', porque sí se sirvió comida),
-- acá no hubo nada que llegara a la mesa — 'entregado' nunca se puede
-- anular (migración 0015), así que una anulación total no deja nada
-- físico que limpiar.
--
-- Misma filosofía que 0015: vive en un trigger, no solo en la pantalla
-- — la app escribe pedidos_items/sesiones_mesa/mesas offline vía
-- PowerSync, así que la base es la barrera real (CLAUDE.md).
-- ============================================================

create or replace function public.liberar_mesa_si_todo_anulado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mesa_id uuid;
  v_quedan_activos integer;
begin
  if new.estado <> 'anulado' or old.estado = 'anulado' then
    return new;
  end if;

  select count(*) into v_quedan_activos
  from public.pedidos_items
  where sesion_id = new.sesion_id and estado <> 'anulado';

  if v_quedan_activos > 0 then
    return new;
  end if;

  update public.sesiones_mesa
  set estado = 'cerrada', cerrada_en = now()
  where id = new.sesion_id and estado = 'abierta'
  returning mesa_id into v_mesa_id;

  if v_mesa_id is not null then
    update public.mesas set estado = 'libre' where id = v_mesa_id;
  end if;

  return new;
end;
$$;

drop trigger if exists pedidos_items_liberar_mesa_si_todo_anulado on public.pedidos_items;
create trigger pedidos_items_liberar_mesa_si_todo_anulado
  after update on public.pedidos_items
  for each row execute function public.liberar_mesa_si_todo_anulado();
