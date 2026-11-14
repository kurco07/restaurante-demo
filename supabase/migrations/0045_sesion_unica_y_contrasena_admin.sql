-- ============================================================
-- Acceso de empleados: administración controla la contraseña,
-- un solo dispositivo conectado a la vez
-- ============================================================
-- Decisión del dueño (2026-11-14):
-- 1. Administración pone (y puede resetear) la contraseña de cada
--    empleado al crearlo, en vez de que el empleado la invente por
--    correo — así nunca se queda sin poder entrar, y administración
--    siempre sabe cuál es la vigente. El empleado nunca la cambia él
--    mismo. Se sigue haciendo desde crear-empleado/gestionar-empleado
--    (clave de servicio) — esta migración no cambia esa parte.
-- 2. Un solo dispositivo con sesión activa por cuenta: al iniciar sesión
--    en uno nuevo, el anterior queda desconectado. No se puede "avisar"
--    a un dispositivo sin internet en el momento — se entera y se cierra
--    solo apenas recupere señal (misma limitación que cualquier bloqueo
--    de cuenta offline-first, ver gestionar-empleado).
--
-- Cómo funciona: cada inicio de sesión genera un token al azar, lo
-- guarda en su propio dispositivo (localStorage) y lo escribe en
-- usuarios.sesion_token mediante esta función (no se puede escribir
-- usuarios directo — migración 0035). Como usuarios ya se sincroniza
-- offline, todos los demás dispositivos del mismo usuario reciben el
-- cambio por PowerSync; si el token que tienen guardado ya no coincide
-- con el de la fila, se cierran solos (UsuarioProvider.tsx).
-- ============================================================

alter table public.usuarios add column sesion_token uuid;

create or replace function public.actualizar_mi_sesion(p_token uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.usuarios set sesion_token = p_token where id = auth.uid()
$$;

-- A propósito muy acotada: solo toca sesion_token de la fila propia
-- (auth.uid()), nada más — no reabre el hueco que cerró la 0035.
revoke all on function public.actualizar_mi_sesion(uuid) from public, anon;
grant execute on function public.actualizar_mi_sesion(uuid) to authenticated;
