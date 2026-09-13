# Plataforma de Restaurantes — Frontend

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

## Estructura del código (MVC)

Ver `docs/estructura-mvc/README.md` para el detalle completo. En resumen:

- `src/models/` — tipos (`types/`) y llamadas a Supabase (`services/`)
- `src/views/` — componentes de UI: `components/` (reutilizables y providers) y `modules/` (una carpeta por módulo de la plataforma — `mesoneros`, `cocina`, `autopedido`, `administracion`, `gerencia`, `super-admin`, `login`)
- `src/controllers/` — hooks que conectan las vistas con los models (`useAuth`, `useUsuario`, `ProtectedRoute`)
- `src/lib/` — clientes de Supabase y PowerSync, configuración compartida
