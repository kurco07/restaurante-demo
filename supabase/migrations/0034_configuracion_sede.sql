-- ============================================================
-- Configuración (Administración) — datos reales por sede
-- ============================================================
-- "Datos del restaurante" (teléfono, horario), "Facturación" (impuesto,
-- propina sugerida) y "Notificaciones" (3 preferencias, sin envío real
-- todavía) pasan de mockData/configuracion.ts a columnas reales en
-- sedes — decisión del dueño: por sede, no por tenant completo,
-- consistente con que sedes.direccion ya vive a ese nivel. La moneda
-- queda fuera a propósito (ver nota ya existente arriba en este archivo,
-- migración 0002: "Moneda... merece una decisión propia").
--
-- De paso se cierra un hueco: sedes_tenant (0002) dejaba escribir la
-- tabla a cualquier usuario del tenant, incluyendo mesonero — mismo
-- patrón de "la pantalla protege, la función no" ya cerrado para
-- personalizacion_marca/suscripciones. Lectura se queda igual de abierta
-- (varias pantallas ya dependen de leer nombre/dirección de las sedes);
-- escritura se acota a administracion/gerencia/super_admin.
-- ============================================================

alter table public.sedes
  add column telefono text,
  add column horario text,
  add column impuesto_porcentaje numeric(5,2) not null default 0,
  add column propina_sugerida_pct numeric(5,2) not null default 0,
  add column notif_stock_bajo boolean not null default true,
  add column notif_pedidos_demorados boolean not null default true,
  add column notif_resumen_diario boolean not null default false;

drop policy if exists "sedes_tenant" on public.sedes;

create policy "sedes_lectura" on public.sedes
  for select using (tenant_id = public.current_tenant_id());

create policy "sedes_escritura" on public.sedes
  for all using (
    tenant_id = public.current_tenant_id()
    and public.current_rol() in ('administracion', 'gerencia', 'super_admin')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_rol() in ('administracion', 'gerencia', 'super_admin')
  );
