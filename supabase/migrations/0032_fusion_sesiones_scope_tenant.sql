-- ============================================================
-- Fase 8, Módulo 1 — acota fusionar_sesion_duplicada() al propio tenant
-- ============================================================
-- Hallazgo de la revisión de la rama de Pedro antes de fusionarla: la
-- política de RLS de inserción en sesiones_mesa (0002) valida que
-- new.tenant_id/sede_id sean los del que llama, pero nunca valida que
-- new.mesa_id pertenezca de verdad a ese tenant (hueco previo, no de esta
-- migración). fusionar_sesion_duplicada() corre security definer —
-- bypassa RLS a propósito para poder ver/actualizar la sesión que
-- sobrevive aunque la haya abierto otro usuario — y hasta ahora buscaba
-- esa sesión solo por mesa_id, sin exigir que fuera del mismo tenant.
--
-- Con eso, un usuario autenticado de un restaurante podía insertar una
-- fila con su propio tenant_id/sede_id (pasa la RLS) pero el mesa_id real
-- de OTRO restaurante (visible en su QR público) y, vía el trigger,
-- escribir sobre la sesión abierta de ese restaurante ajeno (asignarse
-- como mesonero_id si estaba libre, cambiar origen a 'hibrido'). Antes de
-- esta migración, un mesa_id ajeno solo generaba una fila huérfana
-- inofensiva — 0031 fue lo que hizo ese hueco explotable de verdad.
--
-- El hueco más amplio (ninguna fila de sesiones_mesa valida que su
-- mesa_id sea del mismo tenant) sigue sin cerrarse — queda anotado como
-- pendiente aparte, no se resuelve acá. Esto es la mitigación puntual: el
-- propio trigger exige tenant_id = new.tenant_id al buscar y al
-- actualizar la sesión que sobrevive.
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
