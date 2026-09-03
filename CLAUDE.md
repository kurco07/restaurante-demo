# Plataforma de Gestión Integral para Restaurantes

## Qué es esto

SaaS multi-tenant para restaurantes: toma de pedidos (mesonero + autopedido por QR en la misma mesa), cocina con pantalla en tiempo real, inventario con descuento automático por receta, gerencia con reportes, y un motor de IA para sugerencias de compra, platos a preparar y recomendados del día — siempre con aprobación humana antes de ejecutar nada. La app es 100% web, offline-first (debe seguir funcionando si se cae el internet del restaurante), multi-sede, y personalizable por restaurante (marca, colores, mapeo de mesas).

Antes de tomar cualquier decisión de arquitectura o de modelo de datos, revisa:

- `docs/arquitectura.md` — todas las decisiones de producto y arquitectura ya tomadas, organizadas por módulo
- `docs/modelo-de-datos.md` — las 19 tablas del MVP, sus campos y relaciones, explicadas en detalle
- `docs/modelo-de-datos.puml` — el diagrama entidad-relación en PlantUML
- `supabase/migrations/` — el esquema SQL real ya aplicado a la base de datos

Estos documentos son la fuente de verdad del proyecto. Si algo en el código llegara a contradecir lo que dicen, o si una decisión que necesitas no está tomada ahí, pregunta antes de asumir — no inventes una decisión de producto por tu cuenta.

## Stack técnico

- Vite + React + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Realtime, Row Level Security) como backend
- PowerSync para la capa offline-first (sincroniza una base SQLite local en cada dispositivo con Supabase)
- vite-plugin-pwa para que la app sea instalable

## Reglas que no se rompen

- Multi-tenant: cada tabla tiene `tenant_id`, y las políticas de RLS en Supabase son la barrera de seguridad real. Nunca confíes solo en un filtro del lado del cliente para el aislamiento entre restaurantes.
- Ninguna sugerencia de la IA (compra, plato a preparar, recomendado del día) se ejecuta sola. Siempre necesita aprobación de un usuario humano — ver las columnas `aprobada_por` en `ordenes_compra` y `revisada_por` en `sugerencias_ia`.
- El cierre de cuenta de una mesa siempre lo hace un mesonero, nunca el cliente, aunque el pedido se haya hecho por autopedido QR.
- Mesoneros, cocina y mesas deben seguir funcionando sin internet. No agregues nada a esos módulos que dependa de una llamada de red síncrona sin antes pensar en su comportamiento offline.
- Sin hardware propietario: todo corre en un navegador estándar, en cualquier tablet o celular. No se depende de un dispositivo o SDK de hardware específico.
- Realidad aumentada, asistente de IA conversacional, y el marketplace de integraciones están fuera del MVP. No los construyas a menos que se pida explícitamente.

## Estado del proyecto

Fase actual: construcción del MVP. La base de datos en Supabase ya está creada según lo definido en `supabase/migrations/`. Antes de asumir qué parte del frontend ya está construida y cuál no, revisa el código real en `src/` en vez de suponerlo — este archivo no se actualiza con el progreso día a día.
