-- ============================================================
-- Modelo de Datos — MVP — Plataforma de Gestión para Restaurantes
-- Motor: Supabase (Postgres)
-- ============================================================
--
-- Decisión de diseño respecto al documento Modelo_de_Datos.md:
-- se agrega tenant_id directamente en TODAS las tablas (no solo
-- donde aparecía en el documento original), aunque en varios casos
-- se pueda derivar por join (por ejemplo, insumos ya tiene sede_id,
-- y sede ya apunta a tenant_id). Es a propósito: así cada política
-- de seguridad a nivel de fila (RLS) revisa una sola columna directa
-- en vez de encadenar varios joins, lo que las hace más simples y
-- más rápidas. Es una práctica estándar en esquemas multi-tenant
-- sobre Postgres.
--
-- El orden de creación de las tablas sigue las dependencias (una
-- tabla debe existir antes de que otra la referencie), no el orden
-- conceptual del documento de modelo de datos.

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. Identidad y multi-tenancy
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

-- usuarios está ligada 1 a 1 con auth.users, la tabla de autenticación de Supabase
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid references public.sedes(id) on delete set null,
  nombre text not null,
  contacto text,
  rol text not null check (rol in ('mesonero','cocina','supervisor','administracion','gerencia','super_admin')),
  creado_en timestamptz not null default now()
);

create table public.permisos_rol (
  rol text not null,
  accion text not null,
  permitido boolean not null default false,
  primary key (rol, accion)
);

-- Funciones de apoyo para las políticas RLS.
-- security definer + search_path fijo evita que un usuario
-- manipule estas consultas, y evita recursión infinita al
-- consultar la propia tabla usuarios desde dentro de una política.
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
-- 2. Menú e inventario
-- (se crea antes que "operación" porque pedidos_items depende de menu_items)
-- ============================================================

create table public.categorias_menu (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nombre text not null,
  orden integer not null default 0
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

create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  nombre text not null,
  unidad_de_medida text not null,
  tipo text not null check (tipo in ('exacto','por_lote','estimado')),
  cantidad_actual numeric(12,3) not null default 0
);

create table public.recetas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete restrict,
  cantidad_requerida numeric(12,3) not null,
  unidad text not null
);

create table public.lotes_insumo (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  cantidad_inicial numeric(12,3) not null,
  cantidad_restante numeric(12,3) not null,
  abierto_en timestamptz not null default now(),
  cerrado_en timestamptz
);

create table public.movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','salida','merma','ajuste')),
  cantidad numeric(12,3) not null,
  referencia text,
  fecha timestamptz not null default now()
);

-- ============================================================
-- 3. Operación de servicio
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
  notas text,
  agregado_por text not null, -- id de usuario (mesonero) o el texto "cliente"
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
-- 4. Compras e inteligencia artificial
-- ============================================================

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
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
  creada_por text not null, -- id de usuario o el texto "ia"
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
-- 5. Negocio y facturación
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
-- Patrón base: cualquier fila solo es visible/editable si su
-- tenant_id coincide con el tenant del usuario autenticado.
-- Para las tablas operativas del día a día (mesas, sesiones_mesa,
-- pedidos_items, pagos_cierre, insumos, ordenes_compra), se suma
-- una segunda condición: los roles de piso (mesonero, cocina,
-- supervisor) solo ven su propia sede; administración y gerencia
-- ven todas las sedes de su tenant.

alter table public.tenants enable row level security;
create policy "tenants_propio" on public.tenants
  for select using (id = public.current_tenant_id());

alter table public.sedes enable row level security;
create policy "sedes_tenant" on public.sedes
  for all using (tenant_id = public.current_tenant_id());

alter table public.usuarios enable row level security;
create policy "usuarios_tenant" on public.usuarios
  for all using (tenant_id = public.current_tenant_id());

alter table public.categorias_menu enable row level security;
create policy "categorias_menu_tenant" on public.categorias_menu
  for all using (tenant_id = public.current_tenant_id());

alter table public.menu_items enable row level security;
create policy "menu_items_tenant" on public.menu_items
  for all using (tenant_id = public.current_tenant_id());

alter table public.menu_item_sede enable row level security;
create policy "menu_item_sede_tenant" on public.menu_item_sede
  for all using (tenant_id = public.current_tenant_id());

alter table public.suscripciones enable row level security;
create policy "suscripciones_tenant" on public.suscripciones
  for all using (tenant_id = public.current_tenant_id());

alter table public.personalizacion_marca enable row level security;
create policy "personalizacion_marca_tenant" on public.personalizacion_marca
  for all using (tenant_id = public.current_tenant_id());

alter table public.sugerencias_ia enable row level security;
create policy "sugerencias_ia_tenant" on public.sugerencias_ia
  for all using (tenant_id = public.current_tenant_id());

-- Tablas con doble filtro: tenant + sede (según el rol)

alter table public.mesas enable row level security;
create policy "mesas_tenant_sede" on public.mesas
  for all using (
    tenant_id = public.current_tenant_id()
    and (public.current_rol() in ('administracion','gerencia','super_admin')
         or sede_id = public.current_sede_id())
  );

alter table public.sesiones_mesa enable row level security;
create policy "sesiones_mesa_tenant_sede" on public.sesiones_mesa
  for all using (
    tenant_id = public.current_tenant_id()
    and (public.current_rol() in ('administracion','gerencia','super_admin')
         or sede_id = public.current_sede_id())
  );

alter table public.pedidos_items enable row level security;
create policy "pedidos_items_tenant_sede" on public.pedidos_items
  for all using (
    tenant_id = public.current_tenant_id()
    and (public.current_rol() in ('administracion','gerencia','super_admin')
         or sede_id = public.current_sede_id())
  );

alter table public.pagos_cierre enable row level security;
create policy "pagos_cierre_tenant_sede" on public.pagos_cierre
  for all using (
    tenant_id = public.current_tenant_id()
    and (public.current_rol() in ('administracion','gerencia','super_admin')
         or sede_id = public.current_sede_id())
  );

alter table public.insumos enable row level security;
create policy "insumos_tenant_sede" on public.insumos
  for all using (
    tenant_id = public.current_tenant_id()
    and (public.current_rol() in ('administracion','gerencia','super_admin')
         or sede_id = public.current_sede_id())
  );

alter table public.recetas enable row level security;
create policy "recetas_tenant" on public.recetas
  for all using (tenant_id = public.current_tenant_id());

alter table public.lotes_insumo enable row level security;
create policy "lotes_insumo_tenant" on public.lotes_insumo
  for all using (tenant_id = public.current_tenant_id());

alter table public.movimientos_inventario enable row level security;
create policy "movimientos_inventario_tenant" on public.movimientos_inventario
  for all using (tenant_id = public.current_tenant_id());

alter table public.proveedores enable row level security;
create policy "proveedores_tenant" on public.proveedores
  for all using (tenant_id = public.current_tenant_id());

alter table public.ordenes_compra enable row level security;
create policy "ordenes_compra_tenant_sede" on public.ordenes_compra
  for all using (
    tenant_id = public.current_tenant_id()
    and (public.current_rol() in ('administracion','gerencia','super_admin')
         or sede_id = public.current_sede_id())
  );

alter table public.ordenes_compra_items enable row level security;
create policy "ordenes_compra_items_tenant" on public.ordenes_compra_items
  for all using (tenant_id = public.current_tenant_id());

-- ============================================================
-- Tiempo real — necesario para que mesonero, cocina y cliente
-- vean la misma mesa actualizarse en vivo
-- ============================================================

alter publication supabase_realtime add table public.sesiones_mesa;
alter publication supabase_realtime add table public.pedidos_items;
alter publication supabase_realtime add table public.mesas;

-- ============================================================
-- Nota pendiente, importante: el autopedido del cliente por QR
-- NO debe escribir directo a pedidos_items usando RLS anónimo.
-- El cliente no tiene una fila en "usuarios", así que las
-- funciones current_tenant_id() y current_sede_id() no aplican
-- para él. La forma correcta es una función de Postgres (RPC) o
-- un Edge Function que reciba el token de la mesa incluido en el
-- QR, lo valide, y haga el insert con permisos elevados por dentro
-- — no exponer la tabla directamente a escritura pública. Esto se
-- construye en el mismo paso en que se diseñe el flujo de
-- autopedido, no antes.
