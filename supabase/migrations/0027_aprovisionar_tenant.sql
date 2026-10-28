-- ============================================================
-- Fase 7, Módulos 1 y 2 — Registro self-service + aprovisionamiento
-- automático del tenant
-- ============================================================
-- Crea tenant + sede principal + usuario (rol gerencia) + suscripción en
-- trial + fila de personalización de marca, todo en una sola transacción
-- (todo o nada). No se puede llamar desde el cliente: la única vía legal
-- es la Edge Function `registrar-restaurante`, que ya creó el usuario de
-- Auth con la Admin API (clave de servicio) antes de llamar a esta
-- función y le pasa su id. Por eso `security definer` + ejecución
-- restringida a `service_role` — es la única excepción en todo el
-- proyecto donde algo corre con privilegios por encima de RLS desde
-- fuera de la sesión de un usuario real, y está acotada a este único
-- caso (un usuario nuevo, sin tenant todavía, no puede tener su propia
-- sesión con la que RLS lo deje crear su primer tenant).
-- ============================================================

create or replace function public.provisionar_tenant(
  p_auth_user_id uuid,
  p_nombre_restaurante text,
  p_nombre_usuario text,
  p_telefono text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_sede_id uuid;
  v_slug text;
begin
  if coalesce(trim(p_nombre_restaurante), '') = '' then
    raise exception 'El nombre del restaurante es obligatorio.';
  end if;
  if coalesce(trim(p_nombre_usuario), '') = '' then
    raise exception 'El nombre del usuario es obligatorio.';
  end if;

  v_slug := lower(regexp_replace(trim(p_nombre_restaurante), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.tenants (nombre, slug, plan, estado)
  values (trim(p_nombre_restaurante), v_slug, 'starter', 'activo')
  returning id into v_tenant_id;

  insert into public.sedes (tenant_id, nombre)
  values (v_tenant_id, 'Principal')
  returning id into v_sede_id;

  insert into public.usuarios (id, tenant_id, sede_id, nombre, contacto, rol)
  values (p_auth_user_id, v_tenant_id, v_sede_id, trim(p_nombre_usuario), p_telefono, 'gerencia');

  insert into public.suscripciones (tenant_id, plan, precio_acordado, proveedor_de_pago, estado, proximo_cobro)
  values (v_tenant_id, 'starter', 29.00, 'manual', 'activa', (now() + interval '14 days')::date);

  insert into public.personalizacion_marca (tenant_id, nombre_mostrado)
  values (v_tenant_id, trim(p_nombre_restaurante));

  return v_tenant_id;
end;
$$;

revoke all on function public.provisionar_tenant(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.provisionar_tenant(uuid, text, text, text) to service_role;
