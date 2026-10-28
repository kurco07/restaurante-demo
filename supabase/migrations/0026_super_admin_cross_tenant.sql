-- ============================================================
-- Fase 7, Módulo 5 — Panel de super-admin
-- ============================================================
-- Hasta ahora `super_admin` solo estaba protegido del lado del frontend
-- (rolesPorModulo['/super-admin']) — ninguna política de RLS le daba
-- acceso real entre tenants a `tenants`/`sedes`/`usuarios`/`suscripciones`.
-- Se agrega sin tocar las políticas existentes (se suman, nunca se
-- debilitan) — mismo criterio ya usado para las funciones de IA.
--
-- De paso, `suscripciones_tenant` (0002) dejaba leer/escribir la
-- suscripción (precio, proveedor de pago, referencia externa) a
-- cualquier usuario del tenant, incluyendo mesonero/cocina — es
-- información de facturación, mismo criterio que costos/rentabilidad en
-- el resto de la app: se acota a administracion/gerencia (+ super_admin
-- entre tenants, para el panel).
-- ============================================================

-- tenants: hoy solo existía "tenants_propio" (select, propio tenant).
-- Super-admin necesita ver y editar (plan, estado) cualquier tenant.
create policy "tenants_super_admin_select" on public.tenants
  for select using (public.current_rol() = 'super_admin');

create policy "tenants_super_admin_update" on public.tenants
  for update using (public.current_rol() = 'super_admin')
  with check (public.current_rol() = 'super_admin');

-- sedes: solo lectura entre tenants, para contar sedes por tenant en el
-- panel — super-admin no opera sedes ajenas.
create policy "sedes_super_admin_select" on public.sedes
  for select using (public.current_rol() = 'super_admin');

-- usuarios: solo lectura entre tenants, para contar usuarios por tenant.
create policy "usuarios_super_admin_select" on public.usuarios
  for select using (public.current_rol() = 'super_admin');

-- suscripciones: se reemplaza la política original (sin restricción de
-- rol dentro del propio tenant) por una acotada a administracion/gerencia,
-- más una aparte para super_admin entre tenants.
drop policy if exists "suscripciones_tenant" on public.suscripciones;

create policy "suscripciones_tenant_gestion" on public.suscripciones
  for all using (
    tenant_id = public.current_tenant_id()
    and public.current_rol() in ('administracion', 'gerencia')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_rol() in ('administracion', 'gerencia')
  );

create policy "suscripciones_super_admin" on public.suscripciones
  for all using (public.current_rol() = 'super_admin')
  with check (public.current_rol() = 'super_admin');
