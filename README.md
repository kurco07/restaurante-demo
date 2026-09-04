# Plataforma de Restaurantes — Frontend hola cesar

SaaS multi-tenant para restaurantes (mesoneros, autopedido por QR, cocina en
tiempo real, administración/inventario, gerencia y un panel de super-admin),
100% web y offline-first. Ver `docs/` en la raíz del monorepo para el
detalle de arquitectura y modelo de datos.

Este repositorio contiene solo el frontend. La base de datos vive en
`supabase/migrations/`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js`) como backend
- PowerSync (`@powersync/web`) para la capa offline-first
- `vite-plugin-pwa` para que la app sea instalable

## Instalación y desarrollo

```bash
npm install
cp .env.example .env   # completa las variables con tus credenciales
npm run dev
```

Variables de entorno requeridas (ver `.env.example`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_POWERSYNC_URL`

## Estructura de `src/modules/`

Cada carpeta es un módulo de la plataforma, con su propio placeholder de
página por ahora — todavía sin lógica de negocio:

- `mesoneros/` — toma de pedidos por mesa, envío a cocina, cierre de cuenta
- `cocina/` — pantalla de cocina (KDS) en tiempo real
- `autopedido/` — autoatención del cliente por QR en la mesa
- `administracion/` — inventario, recetas, compras, proveedores
- `gerencia/` — dashboards y reportes
- `super-admin/` — panel interno del equipo del SaaS (alta de tenants, uso)

Código compartido entre módulos vive en `src/components/`, `src/hooks/` y
`src/types/`. Los clientes de Supabase y PowerSync están en `src/lib/`.
