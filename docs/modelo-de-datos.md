# Modelo de Datos
## Plataforma de Gestión Integral para Restaurantes

**Proyecto:** Plataforma de gestión integral para restaurantes (SaaS multi-tenant)
**Fecha:** 29 de agosto de 2026
**Complementa:** el documento de arquitectura (sección 4.9) y el diagrama entidad-relación mostrado junto a este documento.

El diagrama muestra el núcleo de 10 entidades más importantes. Aquí está el detalle completo, incluyendo las tablas de apoyo que no entraban en ese diagrama sin saturarlo.

Este documento describe el modelo de datos del MVP. Las funciones que quedaron fuera del MVP (realidad aumentada, y cualquier otra que se agregue más adelante) no se mezclan aquí con las tablas principales — están reunidas aparte, en "Extensiones futuras", para que el esquema del MVP se pueda construir sin cargar con campos que todavía no hacen falta.

---

## Principios de diseño

- **Multi-tenant con `tenant_id`:** una sola base de datos compartida, con `tenant_id` en cada tabla relevante — no una base de datos separada por restaurante cliente, como ya se decidió en el documento de arquitectura.
- **IDs generados en el dispositivo para lo que se crea offline:** `pedidos_items` y `sesiones_mesa` se identifican con un UUID generado por el celular o la tablet, no un número autoincremental del servidor. Así, si el mesonero y el cliente agregan ítems a la misma mesa mientras ambos están sin internet, no hay colisión al sincronizar.
- **Separación por sede vs. por tenant:** lo que es operativo del día a día (mesas, insumos, usuarios de piso) vive a nivel de sede. Lo que es de marca o de negocio (menú base, suscripción, personalización) vive a nivel de tenant.
- **`tenant_id` en todas las tablas, no solo donde parecía necesario:** al construir el esquema real en Supabase, se agregó `tenant_id` de forma directa incluso en tablas que ya lo alcanzaban por relación indirecta (por ejemplo, `recetas` llega a tenant a través de `menu_items`). Esto simplifica y acelera las políticas de seguridad a nivel de fila, que solo necesitan revisar una columna en vez de encadenar varios joins — es una práctica estándar en esquemas multi-tenant sobre Postgres.
- Todas las tablas llevan `creado_en` y `actualizado_en`, aunque no se repitan en cada listado de abajo.

---

## 1. Identidad y multi-tenancy

**tenants** — un registro por restaurante o cadena cliente
id, nombre, slug o subdominio, plan, estado, creado_en

**sedes** — una o más por tenant
id, tenant_id (FK), nombre, dirección, zona_horaria

**usuarios** — el personal que opera el sistema
id, tenant_id (FK), sede_id (FK, puede ser nulo si el usuario opera en varias sedes, como un gerente de cadena), nombre, contacto, rol, credenciales

**permisos_rol** — la matriz de permisos ya definida en el documento de arquitectura (sección 4.10), manejada como tabla real en la base de datos, no como lógica fija en el código de la aplicación
rol, acción, permitido

---

## 2. Operación de servicio

**mesas**
id, sede_id (FK), nombre o número, posición_x, posición_y (para el editor de mapeo visual), estado

**sesiones_mesa** — se abre cuando una mesa empieza a atenderse, sea por mesonero o por autopedido
id, mesa_id (FK), mesonero_id (FK, puede ser nulo si el cliente inició por QR antes de que un mesonero se asigne), estado, origen (mesonero, autopedido, híbrido), abierta_en, cerrada_en

**pedidos_items** — cada línea de pedido dentro de una sesión de mesa
id, sesion_id (FK), menu_item_id (FK), cantidad, notas o modificadores, agregado_por (mesonero_id o "cliente"), estado (pendiente, en preparación, listo, entregado), client_local_id (UUID generado en el dispositivo), sincronizado_en

**pagos_cierre** — el cierre de cuenta de una mesa
id, sesion_id (FK), método_de_pago, monto, propina, cerrado_por (FK a usuarios, siempre un mesonero, según lo ya decidido)

---

## 3. Menú e inventario

**categorias_menu**
id, tenant_id (FK), nombre, orden

**menu_items** — los platos
id, tenant_id (FK), categoria_id (FK), nombre, descripción, precio_base, imagen_url

**menu_item_sede** — las excepciones de un plato en una sede concreta
id, menu_item_id (FK), sede_id (FK), disponible (verdadero o falso), precio_override (nulo si cobra el precio_base normal)

Esta tabla solo tiene fila cuando una sede se aparta de lo normal — por ejemplo, si una sucursal no ofrece cierto plato, o le cobra un precio distinto por costos locales. Si no existe una fila para la combinación de plato y sede, se asume que está disponible al precio_base de siempre. Así, una cadena de veinte sedes con el mismo menú entero no genera veinte filas por plato — solo aparecen las excepciones reales.

**insumos** — los ingredientes, a nivel de sede porque cada sede tiene su propio inventario
id, sede_id (FK), nombre, unidad_de_medida, tipo (exacto, por_lote, o estimado — según la distinción ya definida en el documento de arquitectura, sección 5), cantidad_actual

**recetas** — qué insumos y en qué cantidad componen cada plato
id, menu_item_id (FK), insumo_id (FK), cantidad_requerida, unidad

**lotes_insumo** — para insumos de tipo por_lote, como una salsa preparada que rinde varias porciones
id, insumo_id (FK), cantidad_inicial, cantidad_restante, abierto_en, cerrado_en

**movimientos_inventario** — historial de entradas, salidas y mermas
id, insumo_id (FK), tipo (entrada, salida, merma, ajuste), cantidad, referencia (por ejemplo, el id de la sesión de mesa si la salida fue por una venta), fecha

---

## 4. Compras e inteligencia artificial

**proveedores**
id, sede_id o tenant_id (FK, según si el restaurante centraliza compras o no), nombre, contacto

**ordenes_compra**
id, sede_id (FK), proveedor_id (FK), estado (borrador, aprobada, recibida), creada_por (usuario o "IA"), aprobada_por (FK a usuarios — siempre requerido, según lo ya decidido)

**ordenes_compra_items**
id, orden_compra_id (FK), insumo_id (FK), cantidad, costo_estimado

**sugerencias_ia** — el registro de cada sugerencia generada, para trazabilidad
id, tenant_id (FK), sede_id (FK, puede ser nulo si es un recomendado general), tipo (compra, plato_a_preparar, recomendado_del_dia), contenido, estado (pendiente, aprobada, rechazada), generada_en, revisada_por (FK a usuarios)

---

## 5. Negocio y facturación

**suscripciones**
id, tenant_id (FK), plan, precio_acordado, proveedor_de_pago, referencia_externa (id del cliente en Stripe u otra pasarela), estado, próximo_cobro

**personalizacion_marca**
id, tenant_id (FK), logo_url, color_primario, color_secundario, nombre_mostrado

---

## 6. Reportes

El cierre de turno y los reportes de gerencia se calculan agregando sobre `pagos_cierre` y `movimientos_inventario` — no hace falta necesariamente una tabla física propia para esto. Es una decisión de implementación (vista de base de datos vs. tabla materializada) que no afecta el resto del modelo y se puede resolver más adelante sin bloquear nada.

---

## Notas de implementación clave

Sincronización offline: `pedidos_items` y `sesiones_mesa` deben generarse con un UUID del lado del dispositivo, no un id autoincremental del servidor — esto es lo que permite que dos dispositivos sin conexión trabajen sobre la misma mesa sin chocar al reconectar. El detalle de cómo se resuelve un conflicto real (por ejemplo, ambos agregando el mismo tipo de ítem) vive en el documento de arquitectura, sección 4.11.

Aislamiento por tenant: cada consulta al backend debe filtrar por `tenant_id` a nivel de base de datos (row-level security), no solo a nivel de código de la aplicación — así un error de programación no puede filtrar datos de un restaurante hacia otro.

Multi-sede: la gerencia de una cadena consulta agregando sobre todas las `sedes` de su `tenant`; una sede individual solo ve lo propio.

Permisos en base de datos: al vivir `permisos_rol` como tabla y no como reglas fijas en el código, un cambio en qué puede hacer un supervisor o un administrador se aplica editando una fila, sin necesidad de programar ni desplegar una nueva versión de la aplicación.

---

## Extensiones futuras (fuera del MVP)

Estas tablas o campos no se construyen ahora — se documentan aquí solo para que quede claro dónde van a enganchar cuando llegue su momento, sin obligar a rediseñar nada del MVP.

**Realidad aumentada (fase 3):** cuando se active, `menu_items` gana dos columnas nuevas — `modelo_ar_glb_url` y `modelo_ar_usdz_url` — nulas por defecto en los platos que no tengan modelo 3D. No hace falta ninguna tabla nueva ni tocar ninguna relación existente para agregarlas.

**Personalización de plato (diferido desde Fase 2, Módulo 3):** el mockup original mostraba selección de proteína, quitar ingredientes y extras con precio — hoy `pedidos_items` solo tiene cantidad + nota libre, decisión confirmada con el usuario (2026-10-07) para no diseñar esto todavía. Cuando se retome, probablemente una tabla de opciones por `menu_item` (proteínas disponibles, ingredientes quitables, extras con su propio precio) referenciada desde `pedidos_items` — a diseñar en esa conversación, no asumir esta forma de antemano.

Cualquier otra función que se sume más adelante (por ejemplo, algo relacionado con el marketplace de integraciones o servicios de escaneo 3D, mencionados como exploración futura en la estrategia comercial) sigue el mismo criterio: se añade como columnas nuevas o tablas nuevas cuando se construya de verdad, no se reserva espacio para ella en el esquema del MVP de antemano.
