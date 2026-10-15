# Roadmap de Construcción — MVP
## Plataforma de Gestión Integral para Restaurantes

Este documento organiza cómo se construye el MVP, fase por fase y módulo por módulo. No reemplaza a `arquitectura.md` ni a `modelo-de-datos.md` — ahí está el detalle de cada decisión. Este documento dice en qué orden se construye y qué incluye cada pieza.

No confundir con las fases de lanzamiento de `Estrategia_Comercial_Ejecutiva.md` (esas son de negocio: MVP → atención automatizada → AR piloto → AR a escala). Este documento es de ingeniería: cómo se construye el MVP mismo, paso a paso.

Cómo usarlo: cada módulo se le pasa a Claude Code como su propio prompt, uno a la vez, en el orden en que aparecen. No se pasa a un módulo nuevo hasta que el anterior esté funcionando. Se marca ✅ cuando un módulo queda terminado.

---

## Pantallas ya construidas por adelantado (prototipos navegables, sin módulo de conexión propio)

Antes de que este roadmap se empezara a seguir módulo por módulo, se construyeron varias pantallas de administración como recorrido visual completo, con datos de prueba (`mockData/`). Ninguna de las cuatro que quedan tiene su propio módulo asignado en ninguna fase de abajo — **que sigan en mock no es un bug ni trabajo atrasado**, es que su turno de conectarse a datos reales todavía no llegó. Antes de "arreglar" cualquiera de estas, confirma primero si el roadmap ya le asignó un lugar:

| Pantalla | Archivos | Se conecta como parte de |
|---|---|---|
| Panel (home de administración) | `AdministracionPage.tsx` / `usePanelAdmin.ts` | Ninguna fase lo reclama todavía — decidir si se agrega como módulo nuevo cuando se construya (reutilizaría ventas/más vendidos de Fase 5, mesas de Fase 2, alertas de inventario de Fase 4 — las tres fuentes ya son reales en sus propias pantallas) |
| Pedidos (vista de todos los pedidos) | `PedidosAdminPage.tsx` / `usePedidosAdmin.ts` | Ninguna fase lo reclama todavía — revisar primero si no es redundante con Mesoneros (Fase 2) + Reportes de gerencia (Fase 5) antes de conectarlo |
| Personal | `PersonalPage.tsx` / `usePersonal.ts` | Fase 7, Módulo 6 — Gestión de usuarios y roles |
| Configuración | `ConfiguracionPage.tsx` / `useConfiguracion.ts` | Fase 7, Módulo 4 — Personalización de marca (la sección de branding) y Módulo 3 — Cobro y suscripción (la sección de facturación) |

Esto es justo lo que pasó con "Reportes" de administración (ver `Registro_de_Cambios.md`, 2026-10-13): nadie había dejado por escrito cuál pantalla era mock y a qué fase pertenecía, se construyó un dashboard real en paralelo en gerencia sin saber que ya existía una versión de mentira con las mismas métricas en administración, y terminaron duplicadas con el rol equivocado. Esta tabla existe para que no se repita con las cuatro que quedan.

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

⚠️ **Discrepancia encontrada en auditoría (2026-10-13):** `modelo-de-datos.md` §6 y `arquitectura.md` §4.10 describen un sistema de permisos dinámico respaldado por la tabla `permisos_rol` (rol × acción → permitido), pensado para poder ajustar qué puede hacer un rol editando una fila, sin programar ni desplegar. La tabla existe en la base (`0002_esquema_inicial.sql`) pero el código real nunca la consulta — el gateo de rutas es el mapa estático `rolesPorModulo.ts`. Funciona igual de bien para el alcance actual (pocos roles, matriz fija), pero si algún día se necesita que un restaurante ajuste permisos sin tocar código, falta conectar esa tabla de verdad — por ahora queda como decisión de implementación simplificada, no como error.

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

Nota prometida arriba, completada en la auditoría del 2026-10-13: el mockup original (`docs/interfaces/mockup-personalizar-plato.html`) mostraba selección de proteína, quitar ingredientes y extras con precio — el modal real (`ModalPersonalizacion.tsx` en mesoneros, `HojaPersonalizacion.tsx` en autopedido) solo tiene cantidad + nota libre. Decisión confirmada con el usuario (2026-10-07): diferirlo a propósito hasta diseñar el modelo de datos (ej. una tabla de opciones de personalización por `menu_item`: proteínas disponibles, ingredientes quitables, extras con su propio precio) — no asumir una forma de datos sin retomar esa conversación primero. Ver también `modelo-de-datos.md`, sección "Extensiones futuras".

**Módulo 4 — Sincronización de comandas**
Verificar en la práctica que los pedidos creados offline se suben solos al reconectar, sin duplicarse ni perderse — usando el `client_local_id` ya definido en el modelo de datos. Este módulo es principalmente de pruebas dirigidas: forzar una desconexión real y confirmar el comportamiento.

Verificado contra Supabase real que el `unique(sesion_id, client_local_id)` sí impide duplicados ante un reintento (insert con el mismo `client_local_id` → error 409, la fila original queda intacta). Esto confirma el mecanismo de deduplicación, pero **no** es la misma prueba que pide este módulo: falta todavía cortar la red de verdad en un navegador, armar un pedido con la app realmente offline, reconectar, y confirmar que PowerSync sube la cola sin perder ni duplicar nada — eso solo se puede correr con acceso a navegador real.

**Módulo 5 — Cocina: pantalla en tiempo real** ✅
Una sola pantalla que muestra los pedidos entrantes y permite marcar estado: pendiente, en preparación, listo.

Implementado vía `powerSync.watch` sobre `pedidos_items` (join con `menu_items`/`sesiones_mesa`/`mesas`/`usuarios` para contexto) en vez de Supabase Realtime directo — PowerSync ya cubre tiempo real + offline con un solo mecanismo de reactividad, así que no hace falta uno adicional. Los ítems de una misma mesa que comparten estado se agrupan en una sola tarjeta (un "ticket"), y "Iniciar preparación"/"Marcar listo"/"Entregar" avanza todos esos ítems juntos con un solo `update`, sin abrir el modal de detalle (el modal solo se abre al tocar el resto de la tarjeta, no el botón de acción). La ficha de receta lee `recetas`+`insumos` real por `menu_item_id`, sin el indicador de disponible/agotado (inventario real llega en Fase 4). Verificado en vivo con dos pestañas reales: mesonero envía pedido → aparece en cocina sin recargar.

**Módulo 6 — Cierre de cuenta por mesa** ✅
El mesonero calcula y cierra la cuenta de una mesa específica: método de pago, propina. Siempre lo hace un mesonero, nunca el cliente.

Pantalla nueva (modal), inspirada en el mockup correspondiente — solo la vista mesonero, nunca la de cliente. Calcula el subtotal desde los `pedidos_items` reales de la sesión. `pagos_cierre` no está entre las tablas que PowerSync sincroniza offline (ni en el esquema del cliente ni en la publicación `powersync` de Postgres) — extenderlo requiere tocar las Sync Rules de la instancia PowerSync, así que por decisión explícita el pago se inserta online directo a Supabase (si falla, no se cierra la mesa); `sesiones_mesa`/`mesas` sí se actualizan vía escritura local PowerSync una vez el pago queda registrado. Verificado en vivo.

Nota (auditoría 2026-10-13): no existe ningún campo de descuento en este modal, solo propina — "aplicar descuentos" (mesonero necesita un rol superior) y "descuentos menores" (supervisor) son capacidades que `arquitectura.md` §4.10 promete en la matriz de roles, nunca construidas. Ver Módulo 7 más abajo, que junta esta y otras capacidades de supervisor sin construir.

**Módulo 7 — Capacidades propias de "Supervisor de sala"** 🔲 *identificado en auditoría (2026-10-13), no construido*
El rol `supervisor` existe en el modelo de datos y en `rolesPorModulo.ts` (mismo acceso que mesonero a `/mesoneros`, y que cocina a `/cocina`), pero ninguna de las capacidades que `arquitectura.md` §4.10 le da por encima del mesonero está construida: anular un ítem ya enviado a cocina, transferir una mesa de un mesonero a otro, aplicar descuentos menores a una cuenta. Hoy el único rastro de "cancelar/anular" en todo el proyecto es un botón sin cablear en el mock de `PedidosAdminPage.tsx` (administración, no mesoneros) — el usuario ya había decidido explícitamente dejar "cancelar pedido" como una capacidad futura del admin, pero esa decisión tampoco estaba escrita en ningún documento hasta ahora. En resumen: el rol supervisor hoy no tiene ninguna funcionalidad propia en todo el código, solo hereda el acceso de mesonero/cocina.

---

## Fase 3 — Autopedido del cliente por QR

Se construye después de que el ciclo mesonero + cocina esté probado y funcionando — no antes, como ya se decidió.

**Módulo 1 — Página pública de menú por mesa** ✅
Una vista del menú accesible desde un enlace o QR único por mesa, sin necesidad de que el cliente inicie sesión.

El QR lleva el id de la mesa (`/autopedido/:mesaId`), que llama a la función `menu_publico_mesa` en Supabase (`security definer`, de solo lectura — el cliente anónimo nunca lee tablas directo vía RLS). Devuelve el menú real del tenant de esa mesa: categorías y platos, respetando disponibilidad y precio por sede (`menu_item_sede`, construido en este mismo módulo — también se usa ahora en el menú del mesonero). El carrito del cliente vive solo en memoria del celular; el envío a cocina es el Módulo 2. Administración → Mesas tiene "Enlace del QR" por mesa (copiar / abrir vista del cliente). Migración `0003_menu_publico_mesa.sql` aplicada y probada en vivo (menú público + toggle de disponibilidad por sede). Construido por Pedro — detalle completo en `docs/Registro_de_Cambios.md`.

**Módulo 2 — Función segura de autopedido** ✅
El cliente no tiene cuenta de usuario, así que no debe escribir directo a `pedidos_items` vía RLS. Se construye una función de Postgres (RPC) o Edge Function que valide el identificador de la mesa incluido en el enlace del QR, y haga el insert con permisos elevados por dentro — ya señalado como pendiente en `supabase_schema.sql`.

Función `security definer` `enviar_pedido_autopedido` (migración `0004_autopedido_enviar_pedido.sql`), mismo espíritu que `menu_publico_mesa` (Módulo 1) pero de escritura: el precio de cada ítem lo calcula el servidor desde `menu_items`/`menu_item_sede` — nunca se confía en el precio que el celular tenía cacheado. Si la mesa no tiene sesión abierta, el cliente abre una nueva con `origen = 'autopedido'` y `mesonero_id` nulo (ya contemplado en `modelo-de-datos.md`); si ya hay una abierta, el pedido se agrega ahí. `client_local_id` evita duplicar ante un reintento. La pantalla del cliente ya envía de verdad ("Enviar pedido a cocina") con su propio estado de carga/error y una confirmación.

Nota (auditoría 2026-10-13): el cliente solo puede agregar ítems, nunca editar ni quitar lo que ya envió — quedó anotado en `Registro_de_Cambios.md` (2026-10-11) como "no estaba decidido en los documentos; se puede revisar", y sigue sin resolverse. Cambiar o cancelar algo que cocina ya recibió sigue siendo siempre decisión del mesonero.

**Ajuste confirmado con el usuario tras el primer corte:** el pedido del cliente no pasa directo a `pendiente` — entra como un estado nuevo `por_aprobar` (migración `0005_autopedido_por_aprobar.sql`) hasta que cualquier mesonero disponible de la sede lo apruebe (confirmando con el cliente, evitando errores). Nuevo panel "Pedidos por aprobar" en el mapa de mesas (banner + modal, `usePorAprobar.ts`): cualquier mesonero de la sede ve las solicitudes, no una asignada. Al aprobar, los ítems pasan a `pendiente` (recién ahí cocina los ve — excluidos explícitamente de `useCocina.ts`) y, si la sesión no tenía mesonero asignado, queda el que aprueba — resuelve de paso el hueco de mesas de autopedido sin dueño en el mapa. Verificado el flujo completo contra Supabase real: entra como `por_aprobar`, el mesonero aprueba, pasa a `pendiente`, la sesión queda con mesonero asignado.

**Módulo 3 — Sesión de mesa compartida** ✅
El mesonero y el cliente ven y modifican la misma mesa en tiempo real. El cierre y el pago, sin embargo, siguen pasando siempre por el mesonero (ya decidido). A cargo de Pedro.

Función pública `pedido_publico_mesa` (migración `0006_mesa_compartida.sql`): el celular del cliente consulta cada 5 segundos (mientras la pestaña está visible) el pedido completo de la mesa — lo que cargó el mesonero y lo que pidió por QR, con su estado de cocina y si ya cerró la cuenta. El mesonero lo ve al instante vía PowerSync, sin necesidad de ese polling. Un trigger (`marcar_sesion_hibrida`) pone `sesiones_mesa.origen = 'hibrido'` cuando pidieron los dos. En el mapa, una mesa abierta por QR sin mesonero se distingue en celeste ("sin atender") y se atiende aprobando su pedido — unificado con el flujo del Módulo 2 en vez de dos botones separados.

Probado en vivo por Pedro (migración aplicada, 2026-10-11) — encontró 4 problemas, los 4 ya resueltos:
- Cierre de cuenta con platos sin terminar → bloqueado si algún ítem no llegó a "listo"/"entregado" (decisión: en mesas se prepara primero y se cobra al final; delivery, cuando se construya, sería al revés — anotado en memoria para esa fase).
- Pedido por QR después de cerrar la cuenta → `enviar_pedido_autopedido` (migración `0007`) ya no abre sesión nueva salvo que la mesa esté `libre`; el cliente ve el botón de enviar deshabilitado tras ver que la cuenta cerró.
- Dos mensajes de "vacío" redundantes en "Tu pedido" del cliente → un solo mensaje invitando a ir al menú cuando no hay nada en ninguna de las dos secciones.
- Una mesa ya asignada a un mesonero no avisaba de un pedido nuevo por QR (solo el banner general, desconectado de la mesa) → campanita en la mesa misma del mapa.

Riesgo conocido, sin resolver a propósito: si el mesonero abre la mesa sin internet justo cuando el cliente la abre por QR, pueden quedar dos sesiones abiertas para la misma mesa — no se agregó un índice único porque rompería la cola offline de PowerSync del mesonero (ver Módulo 4 de la Fase 2).

---

## Fase 4 — Administración e inventario completos ✅

El esquema real resultó más simple que el mockup original — varios campos del prototipo (categoría/costo/proveedor directo en insumo, teléfono/correo separados en proveedor, estados "pendiente"/"rechazada" en órdenes de compra) no existían en la base y se decidió, módulo por módulo, cuáles se cortaban y cuáles justificaban una columna nueva (`stock_minimo`, `fecha_vencimiento`, `creado_por`, `creado_en` — migración `0008_inventario_fase4.sql`). Construido completo por Cesar.

**Módulo 1 — Gestión de insumos** ✅
Alta y edición de insumos, con su tipo: exacto, por lote, o estimado (ver `modelo-de-datos.md`).

Crear un insumo también crea su fila en `inventario_sede` (en 0) — así el trigger de descuento del Módulo 2 siempre tiene dónde escribir. Editor simplificado a nombre/unidad/tipo/stock mínimo; eliminar propaga el error de Postgres si el insumo está en una receta (`on delete restrict`). Verificado contra Supabase real.

**Módulo 2 — Descuento automático de inventario** ✅
Al marcar un pedido como entregado, se descuentan automáticamente los insumos según la receta del plato vendido.

Resuelto con un trigger de Postgres (`descontar_inventario_por_entrega`, migración `0008`) en vez de una llamada síncrona desde cocina — `inventario_sede`/`lotes_insumo`/`movimientos_inventario` son online-only (no están en el esquema de PowerSync), así que el trigger reacciona cuando la fila de `pedidos_items` llega al servidor, sea por escritura directa o por la cola offline de PowerSync. Insumos `estimado` no se descuentan (decisión ya tomada en `arquitectura.md`); insumos `por_lote` descuentan del lote FEFO (vencimiento más próximo). Verificado en vivo: marcar "Entregado" en cocina bajó el stock, creó un movimiento `salida`, y redujo el lote correcto.

**Módulo 3 — Lotes de insumo** ✅
Manejo de insumos que se preparan por lote (una salsa, por ejemplo): abrir un lote, ver cuánto rinde, cuánto queda.

Se agregó `fecha_vencimiento` a `lotes_insumo` (decisión confirmada con el usuario) para FEFO real, no solo por fecha de apertura. Registrar un lote suma al total de `inventario_sede` mediante un RPC atómico (`incrementar_inventario_sede`, migración `0009`) para evitar condiciones de carrera. Verificado: dos lotes del mismo insumo (uno con vencimiento, uno sin) suman correctamente, y el trigger del Módulo 2 descuenta primero del que vence antes.

**Módulo 4 — Movimientos de inventario** ✅
Historial de entradas, salidas, mermas y ajustes — la vista contable del stock.

Las entradas/salidas automáticas (trigger de entrega, compra recibida) solo se listan aquí; el formulario de "ajuste manual" (merma/corrección) es real, con `creado_por` = quien lo registra (nulo = automático en los demás casos). Verificado contra Supabase real: stock 10 → merma -3 → corrección +2 → stock final 9.

**Módulo 5 — Proveedores y órdenes de compra** ✅
Alta de proveedores, creación de órdenes de compra, con aprobación humana siempre requerida antes de considerarla confirmada.

Proveedor se simplificó a nombre + un solo campo de contacto libre (sin categoría/teléfono-correo separados/forma de pago, que no existían en la base). `ordenes_compra.estado` solo admite `borrador` → `aprobada` → `recibida` en el esquema real — no hay "rechazada": descartar un borrador simplemente lo elimina (cascada sobre sus items). Al marcar una orden "recibida", cada item suma a `inventario_sede` vía el mismo RPC atómico del Módulo 3, deja un movimiento `entrada`, y si el insumo es `por_lote` abre un lote nuevo pidiendo la fecha de vencimiento en ese momento (igual que al registrar un lote a mano). Verificado end-to-end contra Supabase real: borrador → aprobada → recibida con un insumo exacto y uno por lote, descarte de un borrador, y bloqueo de borrado de un proveedor con órdenes asociadas (`on delete` restrictivo).

**Módulo 6 — Conteos físicos y conciliación** ✅
`arquitectura.md` §4.3 lo incluye explícitamente ("conteos físicos y conciliación") pero no tenía módulo propio en este roadmap — se identificó en la auditoría del 2026-10-13 y se construyó el mismo día.

Pantalla nueva (`ConteoFisicoPage.tsx` / `useConteoFisico.ts`, quinta pestaña de Inventario): lista los insumos de tipo `exacto` con su stock teórico (`inventario_sede.cantidad_actual`) junto a un campo "contado"; la diferencia se registra reutilizando `registrarAjusteManual` (motivo fijo "Conteo físico", tipo `ajuste` si sobra o `merma` si falta) — mismo mecanismo y mismo rastro en Movimientos que un ajuste manual, no un overwrite silencioso. Se eliminó `actualizarStock()` en `inventarioService.ts`, la función sin usar que hacía exactamente ese overwrite — quedó reemplazada por este flujo. Alcance limitado a insumos `exacto` a propósito: los `por_lote` ya se reconcilian lote por lote (abrir/cerrar un lote), y un ajuste agregado aquí desincronizaría `inventario_sede` de la suma real de sus lotes; los `estimado` no se rastrean con precisión (decisión ya tomada, ver sección 5). Verificado contra Supabase real: insumo con stock teórico 20, contado 17 → movimiento `merma` de 3 con la referencia "Conteo físico — fecha: teórico 20 kg, contado 17 kg" y stock final 17.

---

## Fase 5 — Gerencia y reportes

**Módulo 1 — Dashboard de KPIs** ✅
Ventas, rentabilidad por plato, rotación de inventario — agregando sobre los datos ya generados por las fases anteriores.

Construido por Pedro en `/gerencia` (detalle en `docs/Registro_de_Cambios.md`). Todo se agrega en el servidor con funciones `security invoker` (RLS sigue separando restaurantes; anon bloqueado), con un solo selector de período: **ventas** (`kpis_ventas`, migración `0010`), **rotación de inventario** en unidades con valor en stock (`kpis_inventario`, `0011`/`0012`) y **rentabilidad por plato** (`kpis_rentabilidad`, `0012`). Decisión confirmada con el usuario: el costo de un insumo es el de su **última compra recibida** (vista `costo_insumo_actual`), porque `insumos` no tiene costo propio. Platos sin receta o con insumos nunca comprados se marcan aparte, nunca con costo 0. Verificado contra cálculos directos sobre Supabase real: ventas ($165.50 en 6 cuentas), rotación (36 kg, 0,22×) y rentabilidad del plato de prueba ($15 de precio, $30 de costo, −$30 de ganancia en 2 vendidos).

**Módulo 2 — Reportes por turno**
Reporte de ventas y medios de pago al cierre del día, calculado sobre `pagos_cierre` (no necesariamente una tabla nueva, ver `modelo-de-datos.md`, sección 6).

Nota (auditoría 2026-10-13): la matriz de roles de `arquitectura.md` §4.10 le da a "Supervisor de sala" acceso a "reportes del turno", pero `rolesPorModulo.ts` hoy no le da a `supervisor` ningún acceso a `/administracion` ni `/gerencia` — ese rol no puede ver ningún reporte todavía. Este módulo debería decidir cómo resolver eso (una vista reducida propia para supervisor, o ampliar su acceso a esta pantalla) antes de darse por terminado.

**Módulo 3 — Vista multi-sede**
Para cadenas: reportes consolidados de todas las sedes de un tenant, o filtrados por sede individual.

**Módulo 4 — Alertas y excepciones** 🔲 *identificado en auditoría (2026-10-13), no construido*
`arquitectura.md` §4.4 lo incluye explícitamente ("mermas anómalas, descuentos excesivos") pero no tenía módulo propio en este roadmap. Son las excepciones que gerencia necesita ver sin tener que salir a buscarlas activamente.

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
- **Delivery** (pedidos a domicilio) — decisión ya confirmada con el usuario (2026-10-11) para cuando se construya: a diferencia del modelo dine-in de este MVP (se prepara primero, se cobra al cerrar la mesa), delivery debe **cobrar primero y preparar después**, como es estándar en ese tipo de pedido. No reusar el esquema de `pagos_cierre`/`sesiones_mesa` sin cuestionarlo — ese módulo necesita su propio flujo de cobro adelantado.
- Cualquier otra función atractiva que surja con el tiempo y no esté ya cubierta arriba

Este documento es vivo — se actualiza a medida que cada módulo se completa, y se le agrega una fase nueva cuando el negocio decida construir algo de esta lista.
