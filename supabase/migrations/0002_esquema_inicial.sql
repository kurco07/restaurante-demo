-- ============================================================
-- Modelo de Datos — MVP — Plataforma de Gestión para Restaurantes
-- Motor: Supabase (Postgres)
-- Revisión: correcciones tras auditoría externa del esquema
-- ============================================================
--
-- Decisiones de diseño:
-- - tenant_id directo en todas las tablas (denormalizado a propósito)
--   para que las políticas RLS revisen una sola columna, no varios joins.
-- - insumos vive a nivel de TENANT (catálogo: qué existe para la cadena).
--   inventario_sede vive a nivel de SEDE (cuánto hay en cada lugar).
--   Antes ambos estaban mezclados en una sola tabla — ver nota de la
--   auditoría: eso rompía la idea de "un menú, definido una vez".
-- - Moneda: pendiente a propósito. No se resuelve todavía porque el
--   mercado piloto probable (Venezuela) maneja varias monedas de forma
--   simultánea y merece una decisión propia, no una columna improvisada.
--
-- Esta migración reemplaza por completo a 0001_esquema_inicial.sql (que ya
-- no existe en este repo) — no es incremental. Por eso arranca borrando y
-- recreando el schema public entero: así se puede aplicar de cero en
-- cualquier proyecto de Supabase nuevo sin arrastrar el esquema viejo.

drop schema public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. Identidad, roles y multi-tenancy
-- ============================================================

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  plan text not null default 'starter',
  estado text not null default 'activo',
  creado_en timestamptz not null default now()
);

create table public.sedes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nombre text not null,
  direccion text,
  zona_horaria text not null default 'America/Caracas',
  creado_en timestamptz not null default now()
);

-- Catálogo fijo de roles de la plataforma. Si en el futuro cada tenant
-- necesita personalizar sus propios roles, esta tabla gana tenant_id
-- y deja de ser un catálogo único — decisión pendiente, no resuelta aquí.
create table public.roles (
  nombre text primary key
);
insert into public.roles (nombre) values
  ('mesonero'), ('cocina'), ('supervisor'), ('administracion'), ('gerencia'), ('super_admin');

-- usuarios está ligada 1 a 1 con auth.users, la tabla de autenticación de Supabase.
-- Nunca guarda contraseña ni ningún tipo de credencial — Supabase Auth la maneja aparte.
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid references public.sedes(id) on delete set null,
  nombre text not null,
  contacto text,
  rol text not null references public.roles(nombre),
  creado_en timestamptz not null default now()
);
-- Limitación conocida y aceptada por ahora: un usuario pertenece a una sola
-- sede (o a ninguna, si opera a nivel de cadena). Un usuario en varias sedes
-- específicas no se puede representar todavía — no hay caso de uso real
-- esperando esto en el piloto actual.

create table public.permisos_rol (
  rol text not null references public.roles(nombre),
  accion text not null,
  permitido boolean not null default false,
  primary key (rol, accion)
);
-- Pendiente de decidir: si cada restaurante puede personalizar sus propios
-- permisos por rol, esta tabla necesita tenant_id. Hoy asume permisos
-- estándar de la plataforma, iguales para todos los tenants.

-- Catálogos globales, sin tenant_id: por diseño no llevan RLS (ver arriba).
-- Supabase fuerza RLS por defecto en tablas nuevas creadas por SQL Editor,
-- así que hay que desactivarlo explícitamente o quedan invisibles para
-- anon/authenticated sin ninguna política que las libere.
alter table public.roles disable row level security;
alter table public.permisos_rol disable row level security;

create or replace function public.current_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select tenant_id from public.usuarios where id = auth.uid()
$$;

create or replace function public.current_sede_id()
returns uuid language sql stable security definer set search_path = public as $$
  select sede_id from public.usuarios where id = auth.uid()
$$;

create or replace function public.current_rol()
returns text language sql stable security definer set search_path = public as $$
  select rol from public.usuarios where id = auth.uid()
$$;

-- ============================================================
-- 2. Menú (nivel tenant)
-- ============================================================

create table public.categorias_menu (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nombre text not null,
  orden integer not null default 0,
  unique (tenant_id, nombre)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  categoria_id uuid not null references public.categorias_menu(id) on delete restrict,
  nombre text not null,
  descripcion text,
  precio_base numeric(10,2) not null,
  imagen_url text
  -- modelo_ar_glb_url y modelo_ar_usdz_url se agregan en fase 3, no ahora
);

create table public.menu_item_sede (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  disponible boolean not null default true,
  precio_override numeric(10,2),
  unique (menu_item_id, sede_id)
);

-- ============================================================
-- 3. Inventario — catálogo (tenant) vs existencias (sede)
-- ============================================================

-- Catálogo de insumos de la cadena: QUÉ existe conceptualmente, una vez
-- por tenant. No guarda cantidad — eso es local a cada sede.
create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nombre text not null,
  unidad_de_medida text not null,
  tipo text not null check (tipo in ('exacto','por_lote','estimado')),
  unique (tenant_id, nombre)
);

-- CUÁNTO hay de cada insumo, en cada sede específica.
create table public.inventario_sede (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  cantidad_actual numeric(12,3) not null default 0,
  unique (sede_id, insumo_id)
);

-- La receta conecta un plato (tenant) con insumos (tenant) — ya no mezcla
-- niveles, porque insumos dejó de vivir en sede.
create table public.recetas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete restrict,
  cantidad_requerida numeric(12,3) not null,
  unidad text not null,
  unique (menu_item_id, insumo_id)
);

-- Los lotes sí son físicos y locales: una salsa preparada existe en una
-- sede concreta, no en el catálogo abstracto del tenant.
create table public.lotes_insumo (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  cantidad_inicial numeric(12,3) not null,
  cantidad_restante numeric(12,3) not null,
  abierto_en timestamptz not null default now(),
  cerrado_en timestamptz
);

-- Los movimientos también son físicos y locales, por la misma razón.
create table public.movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','salida','merma','ajuste')),
  cantidad numeric(12,3) not null,
  referencia text,
  fecha timestamptz not null default now()
);

-- ============================================================
-- 4. Operación de servicio
-- ============================================================

create table public.mesas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  nombre_numero text not null,
  posicion_x integer,
  posicion_y integer,
  estado text not null default 'libre' check (estado in ('libre','ocupada','por_limpiar'))
);

create table public.sesiones_mesa (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  mesonero_id uuid references public.usuarios(id) on delete set null,
  estado text not null default 'abierta' check (estado in ('abierta','cerrada')),
  origen text not null check (origen in ('mesonero','autopedido','hibrido')),
  abierta_en timestamptz not null default now(),
  cerrada_en timestamptz
);

create table public.pedidos_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  sesion_id uuid not null references public.sesiones_mesa(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  cantidad integer not null default 1,
  precio_unitario numeric(10,2) not null, -- precio congelado al momento del pedido, no se recalcula si el menú cambia después
  notas text,
  agregado_por uuid references public.usuarios(id), -- nulo = lo agregó el cliente por autopedido
  estado text not null default 'pendiente' check (estado in ('pendiente','en_preparacion','listo','entregado')),
  client_local_id uuid not null, -- generado en el dispositivo, clave para la sincronización offline
  sincronizado_en timestamptz,
  creado_en timestamptz not null default now(),
  unique (sesion_id, client_local_id)
);

create table public.pagos_cierre (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  sesion_id uuid not null references public.sesiones_mesa(id) on delete cascade,
  metodo_de_pago text not null,
  monto numeric(10,2) not null,
  propina numeric(10,2) not null default 0,
  cerrado_por uuid not null references public.usuarios(id)
);

-- ============================================================
-- 5. Compras e inteligencia artificial
-- ============================================================

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade, -- siempre requerido
  sede_id uuid references public.sedes(id) on delete set null, -- nulo si la compra se centraliza a nivel de cadena
  nombre text not null,
  contacto text
);

create table public.ordenes_compra (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  proveedor_id uuid not null references public.proveedores(id),
  estado text not null default 'borrador' check (estado in ('borrador','aprobada','recibida')),
  creada_por uuid references public.usuarios(id), -- nulo = generada por la IA
  aprobada_por uuid references public.usuarios(id) -- nulo hasta que alguien la apruebe; nunca se ejecuta sin este dato
);

create table public.ordenes_compra_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  orden_compra_id uuid not null references public.ordenes_compra(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id),
  cantidad numeric(12,3) not null,
  costo_estimado numeric(10,2)
);

create table public.sugerencias_ia (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid references public.sedes(id) on delete set null,
  tipo text not null check (tipo in ('compra','plato_a_preparar','recomendado_del_dia')),
  contenido jsonb not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  generada_en timestamptz not null default now(),
  revisada_por uuid references public.usuarios(id)
);

-- ============================================================
-- 6. Negocio y facturación
-- ============================================================

create table public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan text not null,
  precio_acordado numeric(10,2) not null,
  proveedor_de_pago text not null,
  referencia_externa text,
  estado text not null default 'activa' check (estado in ('activa','pausada','cancelada')),
  proximo_cobro date
);
-- Solo una suscripción activa por tenant a la vez — pero sí se permite
-- historial de suscripciones pausadas o canceladas, por eso es un índice
-- parcial y no un unique directo sobre la columna.
create unique index suscripciones_una_activa_por_tenant
  on public.suscripciones(tenant_id) where estado = 'activa';

create table public.personalizacion_marca (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  logo_url text,
  color_primario text,
  color_secundario text,
  nombre_mostrado text
);

-- ============================================================
-- Row Level Security — aislamiento por tenant en todas las tablas
-- ============================================================

alter table public.tenants enable row level security;
create policy "tenants_propio" on public.tenants for select using (id = public.current_tenant_id());

alter table public.sedes enable row level security;
create policy "sedes_tenant" on public.sedes for all using (tenant_id = public.current_tenant_id());

alter table public.usuarios enable row level security;
create policy "usuarios_tenant" on public.usuarios for all using (tenant_id = public.current_tenant_id());

alter table public.categorias_menu enable row level security;
create policy "categorias_menu_tenant" on public.categorias_menu for all using (tenant_id = public.current_tenant_id());

alter table public.menu_items enable row level security;
create policy "menu_items_tenant" on public.menu_items for all using (tenant_id = public.current_tenant_id());

alter table public.menu_item_sede enable row level security;
create policy "menu_item_sede_tenant" on public.menu_item_sede for all using (tenant_id = public.current_tenant_id());

alter table public.insumos enable row level security;
create policy "insumos_tenant" on public.insumos for all using (tenant_id = public.current_tenant_id());

alter table public.recetas enable row level security;
create policy "recetas_tenant" on public.recetas for all using (tenant_id = public.current_tenant_id());

alter table public.suscripciones enable row level security;
create policy "suscripciones_tenant" on public.suscripciones for all using (tenant_id = public.current_tenant_id());

alter table public.personalizacion_marca enable row level security;
create policy "personalizacion_marca_tenant" on public.personalizacion_marca for all using (tenant_id = public.current_tenant_id());

alter table public.sugerencias_ia enable row level security;
create policy "sugerencias_ia_tenant" on public.sugerencias_ia for all using (tenant_id = public.current_tenant_id());

alter table public.proveedores enable row level security;
create policy "proveedores_tenant" on public.proveedores for all using (tenant_id = public.current_tenant_id());

alter table public.ordenes_compra_items enable row level security;
create policy "ordenes_compra_items_tenant" on public.ordenes_compra_items for all using (tenant_id = public.current_tenant_id());

-- Tablas con doble filtro: tenant + sede (según el rol)

alter table public.inventario_sede enable row level security;
create policy "inventario_sede_tenant_sede" on public.inventario_sede for all using (
  tenant_id = public.current_tenant_id()
  and (public.current_rol() in ('administracion','gerencia','super_admin') or sede_id = public.current_sede_id())
);

alter table public.lotes_insumo enable row level security;
create policy "lotes_insumo_tenant_sede" on public.lotes_insumo for all using (
  tenant_id = public.current_tenant_id()
  and (public.current_rol() in ('administracion','gerencia','super_admin') or sede_id = public.current_sede_id())
);

alter table public.movimientos_inventario enable row level security;
create policy "movimientos_inventario_tenant_sede" on public.movimientos_inventario for all using (
  tenant_id = public.current_tenant_id()
  and (public.current_rol() in ('administracion','gerencia','super_admin') or sede_id = public.current_sede_id())
);

alter table public.mesas enable row level security;
create policy "mesas_tenant_sede" on public.mesas for all using (
  tenant_id = public.current_tenant_id()
  and (public.current_rol() in ('administracion','gerencia','super_admin') or sede_id = public.current_sede_id())
);

alter table public.sesiones_mesa enable row level security;
create policy "sesiones_mesa_tenant_sede" on public.sesiones_mesa for all using (
  tenant_id = public.current_tenant_id()
  and (public.current_rol() in ('administracion','gerencia','super_admin') or sede_id = public.current_sede_id())
);

alter table public.pedidos_items enable row level security;
create policy "pedidos_items_tenant_sede" on public.pedidos_items for all using (
  tenant_id = public.current_tenant_id()
  and (public.current_rol() in ('administracion','gerencia','super_admin') or sede_id = public.current_sede_id())
);

alter table public.pagos_cierre enable row level security;
create policy "pagos_cierre_tenant_sede" on public.pagos_cierre for all using (
  tenant_id = public.current_tenant_id()
  and (public.current_rol() in ('administracion','gerencia','super_admin') or sede_id = public.current_sede_id())
);

alter table public.ordenes_compra enable row level security;
create policy "ordenes_compra_tenant_sede" on public.ordenes_compra for all using (
  tenant_id = public.current_tenant_id()
  and (public.current_rol() in ('administracion','gerencia','super_admin') or sede_id = public.current_sede_id())
);

-- ============================================================
-- Tiempo real
-- ============================================================

alter publication supabase_realtime add table public.sesiones_mesa;
alter publication supabase_realtime add table public.pedidos_items;
alter publication supabase_realtime add table public.mesas;

-- ============================================================
-- Notas pendientes, sin resolver a propósito:
-- - Moneda: no se agregó todavía (ver encabezado del archivo).
-- - Sistema de personalización de platos (proteína, quitar ingredientes,
--   extras) del trabajo de interfaz: todavía no tiene tablas — se agrega
--   en una revisión aparte, dedicada solo a eso.
-- - Pedidos "para llevar": hoy toda sesión de mesa exige una mesa física.
--   Un pedido para llevar no encaja en el modelo actual.
-- - Número de pedido legible (ej. "Pedido #108"): hoy solo existe el
--   UUID interno, no un número secuencial simple para mostrar en cocina.
-- - El autopedido del cliente no debe escribir directo a pedidos_items
--   usando RLS anónimo — necesita una función (RPC) o Edge Function que
--   valide el token de la mesa desde el QR y escriba con permisos
--   elevados por dentro.
-- ============================================================
