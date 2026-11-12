-- ============================================================
-- Fase 8, Módulo 1 — recupera fusionar_sesion_duplicada() rota en producción
-- ============================================================
-- Hallazgo de la prueba offline real del 2026-11-12: la función que corre
-- en la base de datos real le faltaban dos líneas respecto a lo que dicen
-- las migraciones 0031/0032 — alguien corrió una versión incompleta
-- directo en el SQL Editor en algún momento, sin pasar por una migración,
-- y nunca se corrigió. Sin `fusionada_en`, el trigger que redirige los
-- platos (`redirigir_plato_a_sesion_viva`) no tiene a dónde apuntar: los
-- platos de la sesión "perdedora" se quedan huérfanos en una sesión
-- cerrada que nadie revisa — aparecen en cocina (que no mira el estado de
-- la sesión) pero nunca llegan a la cuenta real ni se cobran.
--
-- Esto repone exactamente el mismo código de la migración 0032 — no
-- cambia el diseño, solo corrige lo que faltaba en la base real.
-- ============================================================

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
  where mesa_id = new.mesa_id
    and tenant_id = new.tenant_id
    and estado = 'abierta'
    and id <> new.id
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
   where id = v_existente.id
     and tenant_id = new.tenant_id;

  return new;
end;
$$;
