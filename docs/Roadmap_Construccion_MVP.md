# Roadmap de Construcción — MVP
## Plataforma de Gestión Integral para Restaurantes

Este documento organiza cómo se construye el MVP, fase por fase y módulo por módulo. No reemplaza a `arquitectura.md` ni a `modelo-de-datos.md` — ahí está el detalle de cada decisión. Este documento dice en qué orden se construye y qué incluye cada pieza.

No confundir con las fases de lanzamiento de `Estrategia_Comercial_Ejecutiva.md` (esas son de negocio: MVP → atención automatizada → AR piloto → AR a escala). Este documento es de ingeniería: cómo se construye el MVP mismo, paso a paso.

Cómo usarlo: cada módulo se le pasa a Claude Code como su propio prompt, uno a la vez, en el orden en que aparecen. No se pasa a un módulo nuevo hasta que el anterior esté funcionando. Se marca ✅ cuando un módulo queda terminado.

---

## Fase 0 — Completado

- ✅ Estructura del proyecto (Vite + React + TypeScript + Tailwind)
- ✅ PWA configurada (app shell cacheado)
- ✅ Cliente de Supabase inicializado (sin lógica real todavía)
- ✅ Cliente de PowerSync inicializado (esquema vacío, pendiente)
- ✅ Carpetas placeholder de los módulos, con enrutamiento básico
- ✅ Base de datos creada en Supabase según `supabase/migrations/`, con RLS activado

---

## Fase 1 — Backend base: autenticación e identidad

Antes de construir cualquier pantalla real, la app necesita saber quién es el usuario, a qué tenant y sede pertenece, y qué puede hacer.

**Módulo 1 — Autenticación** ✅
Login y logout usando Supabase Auth. Persistencia de sesión (el usuario no tiene que volver a iniciar sesión cada vez que abre la app). Pantalla de login simple.

**Módulo 2 — Contexto de usuario, tenant y sede** ✅
Un proveedor de contexto (o hook global) que expone en toda la app: el usuario autenticado, su `tenant_id`, su `sede_id` (si aplica), y su `rol`. Todo el resto de la app depende de esto para saber qué mostrar y qué permitir.

**Módulo 3 — Enrutamiento protegido por rol** ✅
Cada ruta de módulo solo es accesible para los roles que corresponden, según la matriz de `permisos_rol` (ver `arquitectura.md`, sección 4.10). Un mesonero no debería poder ni ver la URL de administración.

Matriz confirmada con el usuario (gerencia con acceso total, incluida cocina): `/mesoneros` → mesonero/supervisor/gerencia · `/cocina` → cocina/supervisor/gerencia · `/administracion` → administracion/gerencia · `/gerencia` → gerencia · `/super-admin` → super_admin · `/autopedido` queda pública, sin login (vista del cliente por QR). Ver `src/lib/rolesPorModulo.ts`.

**Módulo 4 — Esquema real de PowerSync** ✅
Definir el Schema del lado del cliente (ya no vacío) para las tablas que sí necesitan estar disponibles offline: `sedes`, `usuarios`, `categorias_menu`, `menu_items`, `menu_item_sede`, `mesas`, `sesiones_mesa`, `pedidos_items`, `insumos`, `recetas` — las mismas que ya están en la publicación `powersync` de Supabase. Conectar el cliente y confirmar que sincroniza contra una instancia real de PowerSync.

Dependencia: la instancia de PowerSync y las Sync Rules ya deben estar creadas (ver `Supabase_PowerSync_Setup_Comandos.md`, parte 6).

Verificado end-to-end con una sesión real: `powerSync.currentStatus` reporta `connected: true` y `hasSynced: true`, y la tabla `usuarios` en SQLite local ya trae las filas reales de Postgres filtradas por tenant. Conector real en `src/lib/powerSyncClient.ts` (`fetchCredentials` vía sesión de Supabase Auth, `uploadData` sube la cola CRUD local a Supabase).

---

## Fase 2 — Núcleo operativo: menú, mesoneros y cocina

Este es el ciclo central del producto — el que resuelve los tres dolores originales (pedidos, cierres manuales, inventario ciego). Todo lo demás es soporte a este ciclo.

**Módulo 1 — Menú y recetas (versión mínima)** ✅
Alta de categorías, platos, precio, y los insumos con su cantidad que componen cada plato. Suficiente para poder tomar pedidos y descontar inventario — la gestión completa de insumos (proveedores, compras, lotes) se construye en la Fase 4, no aquí.

Implementado en `src/views/modules/administracion/` (alta, edición y borrado de categorías y platos; editor de receta por plato que reutiliza un insumo existente o crea uno nuevo al vuelo). Verificado en vivo contra Supabase con una sesión real, incluida recarga de página para confirmar persistencia. El menú real del cliente piloto (`docs/Menu.md`) ya está cargado: 13 categorías, 45 platos — sin recetas todavía, porque el documento del cliente no trae cantidades de insumo por plato.

**Módulo 2 — Mapeo de mesas** ✅
Editor visual para crear la distribución de mesas del salón. Vista de estado de cada mesa: libre, ocupada, por limpiar.

Implementado con `mesaService.ts` (CRUD online para administración) + lectura reactiva vía `powerSync.watch` para el mapa del mesonero (hook reutilizable `usePowerSyncWatch`, primer uso de lectura offline en el proyecto). La posición no se edita con números X/Y — el plano de administración es interactivo: "+ Agregar mesa" entra en modo "colocar" (clic en el plano) y cada mesa existente se arrastra con el mouse para moverla (mejora pedida por el usuario sobre la versión mínima original). "Abrir mesa y tomar pedido" crea de verdad una fila en `sesiones_mesa`. Verificado en vivo con dos sesiones reales (administración + mesonero, dos navegadores): una mesa creada o movida en administración aparece sola en el mapa del mesonero sin recargar.

**Módulo 3 — Toma de pedidos del mesonero (offline)** ✅
El mesonero abre una mesa y agrega ítems del menú. El sistema completo de personalización (proteína, quitar ingredientes, extras) del mockup original queda diferido a propósito — no existe tabla para eso todavía, y se confirmó con el usuario dejarlo así por ahora (ver nota al final de este módulo). Por ahora cada ítem es cantidad + nota libre.

El menú (categorías y platos) se lee vía `powerSync.watch`, así que armar el pedido funciona sin internet. "Enviar a cocina" inserta de verdad en `pedidos_items` como escritura local PowerSync, uno por ítem, con `client_local_id` (clave de deduplicación ante reintentos offline). Verificado en vivo contra RLS real y end-to-end con cocina viendo el pedido sin recargar.

**Módulo 4 — Sincronización de comandas**
Verificar en la práctica que los pedidos creados offline se suben solos al reconectar, sin duplicarse ni perderse — usando el `client_local_id` ya definido en el modelo de datos. Este módulo es principalmente de pruebas dirigidas: forzar una desconexión real y confirmar el comportamiento.

Pendiente de correr la prueba real (cortar red, armar pedido offline, reconectar, confirmar en Supabase que no se duplicó). La base técnica ya está lista — PowerSync es quien maneja la cola local y el `unique(sesion_id, client_local_id)` del esquema ya cubre el caso de reintento — pero no se ha ejecutado la verificación dirigida todavía.

**Módulo 5 — Cocina: pantalla en tiempo real** ✅
Una sola pantalla que muestra los pedidos entrantes y permite marcar estado: pendiente, en preparación, listo.

Implementado vía `powerSync.watch` sobre `pedidos_items` (join con `menu_items`/`sesiones_mesa`/`mesas`/`usuarios` para contexto) en vez de Supabase Realtime directo — PowerSync ya cubre tiempo real + offline con un solo mecanismo de reactividad, así que no hace falta uno adicional. Los ítems de una misma mesa que comparten estado se agrupan en una sola tarjeta (un "ticket"), y "Iniciar preparación"/"Marcar listo"/"Entregar" avanza todos esos ítems juntos con un solo `update`, sin abrir el modal de detalle (el modal solo se abre al tocar el resto de la tarjeta, no el botón de acción). La ficha de receta lee `recetas`+`insumos` real por `menu_item_id`, sin el indicador de disponible/agotado (inventario real llega en Fase 4). Verificado en vivo con dos pestañas reales: mesonero envía pedido → aparece en cocina sin recargar.

**Módulo 6 — Cierre de cuenta por mesa** ✅
El mesonero calcula y cierra la cuenta de una mesa específica: método de pago, propina. Siempre lo hace un mesonero, nunca el cliente.

Pantalla nueva (modal), inspirada en el mockup correspondiente — solo la vista mesonero, nunca la de cliente. Calcula el subtotal desde los `pedidos_items` reales de la sesión. `pagos_cierre` no está entre las tablas que PowerSync sincroniza offline (ni en el esquema del cliente ni en la publicación `powersync` de Postgres) — extenderlo requiere tocar las Sync Rules de la instancia PowerSync, así que por decisión explícita el pago se inserta online directo a Supabase (si falla, no se cierra la mesa); `sesiones_mesa`/`mesas` sí se actualizan vía escritura local PowerSync una vez el pago queda registrado. Verificado en vivo.

---

## Fase 3 — Autopedido del cliente por QR

Se construye después de que el ciclo mesonero + cocina esté probado y funcionando — no antes, como ya se decidió.

**Módulo 1 — Página pública de menú por mesa** ✅
Una vista del menú accesible desde un enlace o QR único por mesa, sin necesidad de que el cliente inicie sesión.

El QR lleva el id de la mesa (`/autopedido/:mesaId`), que llama a la función `menu_publico_mesa` en Supabase (`security definer`, de solo lectura — el cliente anónimo nunca lee tablas directo vía RLS). Devuelve el menú real del tenant de esa mesa: categorías y platos, respetando disponibilidad y precio por sede (`menu_item_sede`, construido en este mismo módulo — también se usa ahora en el menú del mesonero). El carrito del cliente vive solo en memoria del celular; el envío a cocina es el Módulo 2. Administración → Mesas tiene "Enlace del QR" por mesa (copiar / abrir vista del cliente). Migración `0003_menu_publico_mesa.sql` aplicada y probada en vivo (menú público + toggle de disponibilidad por sede). Construido por Pedro — detalle completo en `docs/Registro_de_Cambios.md`.

**Módulo 2 — Función segura de autopedido**
El cliente no tiene cuenta de usuario, así que no debe escribir directo a `pedidos_items` vía RLS. Se construye una función de Postgres (RPC) o Edge Function que valide el identificador de la mesa incluido en el enlace del QR, y haga el insert con permisos elevados por dentro — ya señalado como pendiente en `supabase_schema.sql`.

**Módulo 3 — Sesión de mesa compartida**
El mesonero y el cliente ven y modifican la misma mesa en tiempo real. El cierre y el pago, sin embargo, siguen pasando siempre por el mesonero (ya decidido).

---

## Fase 4 — Administración e inventario completos

**Módulo 1 — Gestión de insumos**
Alta y edición de insumos, con su tipo: exacto, por lote, o estimado (ver `modelo-de-datos.md`).

**Módulo 2 — Descuento automático de inventario**
Al marcar un pedido como entregado, se descuentan automáticamente los insumos según la receta del plato vendido.

**Módulo 3 — Lotes de insumo**
Manejo de insumos que se preparan por lote (una salsa, por ejemplo): abrir un lote, ver cuánto rinde, cuánto queda.

**Módulo 4 — Movimientos de inventario**
Historial de entradas, salidas, mermas y ajustes — la vista contable del stock.

**Módulo 5 — Proveedores y órdenes de compra**
Alta de proveedores, creación de órdenes de compra, con aprobación humana siempre requerida antes de considerarla confirmada.

---

## Fase 5 — Gerencia y reportes

**Módulo 1 — Dashboard de KPIs**
Ventas, rentabilidad por plato, rotación de inventario — agregando sobre los datos ya generados por las fases anteriores.

**Módulo 2 — Reportes por turno**
Reporte de ventas y medios de pago al cierre del día, calculado sobre `pagos_cierre` (no necesariamente una tabla nueva, ver `modelo-de-datos.md`, sección 6).

**Módulo 3 — Vista multi-sede**
Para cadenas: reportes consolidados de todas las sedes de un tenant, o filtrados por sede individual.

---

## Fase 6 — Inteligencia artificial

Se construye una vez que las fases anteriores ya están generando datos reales — la IA no tiene nada de qué aprender antes de eso.

**Módulo 1 — Capa adaptadora de proveedor de IA**
Integración desacoplada del proveedor (empezar con la API de Gemini por su nivel gratuito para pruebas, según lo ya decidido), para poder cambiar de modelo sin reescribir el resto.

**Módulo 2 — Sugerencias de compra**
Basadas en el consumo histórico registrado en `movimientos_inventario`.

**Módulo 3 — Sugerencias de qué platos preparar**
Según inventario disponible y rentabilidad.

**Módulo 4 — Recomendados del día**

**Módulo 5 — Flujo de aprobación humana**
Ninguna sugerencia se ejecuta sola — cada una queda en `sugerencias_ia` con estado pendiente hasta que un usuario la apruebe o la rechace. Esto no es opcional, es una regla del proyecto (ver `CLAUDE.md`).

---

## Fase 7 — Multi-tenant, negocio y personalización

**Módulo 1 — Registro self-service de un restaurante nuevo**
Formulario de alta, sin intervención manual del equipo.

**Módulo 2 — Aprovisionamiento automático del tenant**
Al registrarse, se crea automáticamente el tenant, su primera sede, y el usuario administrador inicial.

**Módulo 3 — Cobro y suscripción**
Integración con la pasarela de pago que corresponda según el país donde surja el primer grupo de restaurantes (ver `Estrategia_Comercial_Ejecutiva.md`, sección de pagos).

**Módulo 4 — Personalización de marca**
Logo, colores, nombre mostrado — self-service, como parte del panel de configuración inicial.

**Módulo 5 — Panel de super-admin**
Para el equipo del SaaS: alta y gestión de tenants, soporte, visibilidad general de uso.

**Módulo 6 — Gestión de usuarios y roles**
Dentro de cada restaurante: administración/gerencia puede crear cuentas de mesoneros y cocina, con su rol correspondiente.

---

## Fase 8 — Endurecimiento y piloto

**Módulo 1 — Pruebas reales de offline**
Desconexión forzada, verificación de que ningún pedido se pierde o se duplica, en los tres dispositivos a la vez (mesonero, cliente, cocina).

**Módulo 2 — Manejo de errores y estados de carga**
En toda la app: qué ve el usuario cuando algo falla o está cargando.

**Módulo 3 — Optimización**
Tamaño de la PWA, tiempos de carga, rendimiento en dispositivos de gama baja (relevante para el mercado objetivo).

**Módulo 4 — Piloto beta**
Con restaurantes reales, según lo ya definido en `Estrategia_Comercial_Ejecucion.md`.

Nota honesta sobre el orden: esto significa que el piloto beta se corre con la interfaz de pruebas, no con la versión pulida de la Fase 9. Es una decisión válida — valida primero que la propuesta central funcione (que no se pierda un pedido, que el inventario cuadre) sin el costo de pulir una pantalla que todavía puede cambiar por feedback real. La contrapartida es que los restaurantes del piloto van a ver algo funcional pero visualmente básico, así que hay que ser claro con ellos en la oferta piloto sobre eso.

---

## Fase 9 — Interfaz y experiencia de usuario (versión final, pulida)

Hasta la Fase 8, cada módulo se construye con una interfaz de prueba: funcional, sin animaciones, solo para validar que la lógica funciona. Esta fase toma todos los módulos ya probados y les aplica la interfaz real del producto — con transiciones y microinteracciones en toda la app, nada estático, pensada para sentirse intuitiva y profesional. Se trata como un proyecto en sí mismo, con sus propios módulos, no como un ajuste rápido de estilos al final.

Herramienta recomendada para las animaciones: Motion (antes llamada Framer Motion — el nombre y el paquete de npm cambiaron; se importa como `motion/react`, no como `framer-motion`; confirma el nombre exacto vigente en su documentación al momento de instalarla). Es la librería de animación para React más usada y mejor soportada hoy, con soporte de spring physics, gestos, transiciones de layout y scroll.

**Módulo 1 — Sistema de diseño**
Paleta de colores, tipografía, espaciado, y una biblioteca de componentes base reutilizables (botones, campos, tarjetas, modales) con sus estados y transiciones ya integrados desde el componente mismo, no agregados pantalla por pantalla.

**Módulo 2 — Lenguaje de movimiento**
Definir los patrones de animación que se van a repetir en toda la app: cómo entran y salen las pantallas, cómo aparecen y desaparecen los elementos de una lista, duración y curva de easing estándar — para que se sienta como un solo lenguaje visual y no como animaciones sueltas por pantalla.

**Módulo 3 — Interfaz de mesoneros y autopedido**
Rediseño del flujo de toma de pedidos y del mapa de mesas con el sistema de diseño y las transiciones ya definidas — es la pantalla que más se usa en el día a día, la que más debe sentirse fluida.

**Módulo 4 — Interfaz de cocina**
Pensada para leerse rápido a distancia. Transiciones claras entre estados de un pedido, alertas visuales animadas para demoras sin que se vuelvan una distracción.

**Módulo 5 — Interfaz de administración e inventario**
Formularios y tablas con transiciones fluidas al editar, crear o filtrar.

**Módulo 6 — Interfaz de gerencia y reportes**
Visualización de datos (gráficas, indicadores) con animaciones de entrada y transición entre rangos de fecha o filtros.

**Módulo 7 — Interfaz de onboarding y self-service**
El registro de un restaurante nuevo es la primera impresión real del producto — antes de que alguien pague, esto es lo único que ve. Se cuida con el mismo nivel que la interfaz de venta, no como una pantalla administrativa más.

**Módulo 8 — Interfaz de super-admin**
Mismo sistema de diseño por consistencia, sin necesidad del mismo nivel de pulido visual que las interfaces orientadas al cliente final.

**Módulo 9 — Indicadores de estado de conexión**
Algo que hoy no tiene la interfaz de pruebas: mostrarle al mesonero y a la cocina, de forma clara y no invasiva, cuándo están offline y cuándo se está sincronizando al volver la conexión — es parte central de la propuesta de valor, no un detalle cosmético.

**Módulo 10 — Validación de usabilidad**
Revisión con usuarios reales (o al menos heurística) de que la interfaz final es intuitiva y no solo visualmente atractiva — son dos cosas distintas y ambas se pidieron.

---

## Funciones fuera de este plan (fase futura, no se construyen todavía)

Estas ya están identificadas pero no forman parte de ninguna fase de arriba. Se agregan a este documento como una fase nueva cuando de verdad se decida construirlas — no antes:

- Realidad aumentada de platos (ver `arquitectura.md`, sección 4.6)
- Asistente de IA conversacional para atención al cliente (descartado, ver `arquitectura.md`, sección 4.1)
- Marketplace de integraciones
- Servicios de escaneo 3D
- Predicciones avanzadas de demanda
- Integraciones con POS existentes, impresoras físicas, y pasarelas de pago adicionales a la principal
- Cualquier otra función atractiva que surja con el tiempo y no esté ya cubierta arriba

Este documento es vivo — se actualiza a medida que cada módulo se completa, y se le agrega una fase nueva cuando el negocio decida construir algo de esta lista.
