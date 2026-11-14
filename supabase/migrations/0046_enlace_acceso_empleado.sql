-- ============================================================
-- Enlace único de acceso para empleados (no administración)
-- ============================================================
-- Decisión del dueño (2026-11-14): solo administración entra por el
-- login normal (correo + contraseña escritos a mano). El resto de los
-- roles (mesonero, cocina, supervisor, gerencia) tiene un enlace propio
-- por persona — /acceso/<su id> — que ya sabe quién es y solo pide la
-- contraseña, sin escribir el correo. Administración copia el enlace
-- desde la ficha del empleado y se lo manda por WhatsApp, correo o en
-- persona.
--
-- Esta función es la única parte de esto que corre SIN sesión (hace
-- falta para que la página sepa a quién saludar y con qué correo
-- autenticar antes de que la persona haya iniciado sesión) — por eso es
-- `security definer` y se le da permiso a `anon`. A propósito devuelve
-- solo nombre y correo, nunca nada del tenant/rol/otros datos, y nada
-- si el usuario no existe, está inactivo, o es de administración (ese
-- rol sigue siendo solo por el login normal). El id del empleado hace
-- de token: es un uuid, no es adivinable.
-- ============================================================

create or replace function public.info_acceso_empleado(p_usuario_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('nombre', u.nombre, 'email', u.email)
  from usuarios u
  where u.id = p_usuario_id
    and u.activo = true
    and u.rol <> 'administracion'
    and u.email is not null
$$;

revoke all on function public.info_acceso_empleado(uuid) from public;
grant execute on function public.info_acceso_empleado(uuid) to anon, authenticated;
