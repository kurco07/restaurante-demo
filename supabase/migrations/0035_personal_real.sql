-- ============================================================
-- Personal (Administración) — lista real, correo, activar/desactivar
-- ============================================================
-- Hallazgo de seguridad: "usuarios_tenant" (migración 0002) era
-- `for all using (tenant_id = current_tenant_id())`, sin ninguna
-- restricción de rol — cualquier usuario autenticado, incluyendo un
-- mesonero, podía reescribir su propia fila de usuarios por API directa
-- y cambiarse el rol a administracion/gerencia. Más serio que los huecos
-- ya cerrados antes (sedes, personalizacion_marca, suscripciones): acá
-- se cierra de raíz, usuarios pasa a ser solo lectura por RLS. Crear,
-- activar/desactivar y eliminar empleados ya pasan (o van a pasar) por
-- Edge Functions con clave de servicio, que verifican tenant/rol del
-- lado del servidor — mismo patrón que crear-empleado ya usa.
-- ============================================================

alter table public.usuarios
  add column email text,
  add column activo boolean not null default true;

-- Backfill de una sola vez: los empleados que ya existían antes de esta
-- migración no tenían correo guardado en usuarios (solo en auth.users,
-- que no se puede leer por REST, pero sí directo en una migración SQL).
update public.usuarios u
set email = a.email
from auth.users a
where a.id = u.id and u.email is null;

drop policy if exists "usuarios_tenant" on public.usuarios;

create policy "usuarios_lectura" on public.usuarios
  for select using (tenant_id = public.current_tenant_id());

-- A propósito: sin política de insert/update/delete para authenticated.
-- Toda escritura queda bloqueada por defecto salvo desde funciones con
-- clave de servicio (crear-empleado, gestionar-empleado).
