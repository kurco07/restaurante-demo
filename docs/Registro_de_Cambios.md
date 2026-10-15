# Registro de cambios

Seguimiento de lo que se cambia en el proyecto, más reciente primero. Cada entrada dice qué se hizo, para qué, qué decisiones se tomaron y qué queda pendiente. Complementa a `Roadmap_Construccion_MVP.md` (qué falta construir) con el detalle de qué se construyó y cómo.

---

## 2026-10-15 — Fase 5, Módulo 1 (rotación de inventario)

Rama: `feature/fase5-dashboard-kpis`. Autor: Pedro (con Claude Code). Se apoya en el inventario real de la Fase 4 (César).

### Para qué sirve

Gerencia ve en `/gerencia`, debajo de las ventas y con el mismo selector de período, qué tan rápido se gasta cada insumo: cuánto se consumió en platos, cuánto se perdió por merma, cuánto queda, cuántas veces "rotó" el stock y para cuántos días alcanza lo que queda. Cada insumo lleva un estado: **Bajo el mínimo**, **Por agotarse**, **Rota lento**, **Sin movimiento** o **Normal**. Primero aparece lo que pide acción.

### Cómo funciona

- Función `kpis_inventario(desde, hasta, sede)` (migración `0011`), `security invoker` como `kpis_ventas`: RLS sigue separando restaurantes, anon no puede llamarla.
- Sale de `movimientos_inventario` (cantidad siempre positiva; `entrada` y `ajuste` suman, `salida` y `merma` restan) e `inventario_sede`.
- **Consumo** = salidas del período (el descuento automático por plato entregado). **Rotación** = (consumo + merma) / stock promedio del período. El stock al inicio y al final del período se reconstruye restando al stock actual los movimientos posteriores.
- **Alcanza para** = stock actual / consumo diario del período.
- Los insumos `estimado` no se incluyen: no se descuentan por receta (decisión de la Fase 4), siempre saldrían en cero.
- El stock mínimo solo se muestra filtrando una sede; sumar mínimos de varias sedes no tiene sentido.

### Decisiones tomadas

| Decisión | Por qué / alternativa |
| --- | --- |
| En unidades del insumo, no en dinero | `insumos` no tiene costo. Valorizarla depende de la misma decisión que la rentabilidad por plato. |
| Umbrales: por agotarse ≤ 3 días, lento > 30 días | Punto de partida razonable; son dos constantes en `TablaRotacion.tsx`, fáciles de cambiar si el restaurante prefiere otros. |
| Se carga junto con las ventas | Un solo selector de período y una sola espera para todo el dashboard. |

### Archivos

| Archivo | Cambio |
| --- | --- |
| `supabase/migrations/0011_kpis_inventario.sql` | Nuevo — función `kpis_inventario` |
| `src/models/types/kpis.ts`, `src/models/types/index.ts` | Tipo `RotacionInsumo` |
| `src/models/services/kpisService.ts` | `fetchKpisInventario` |
| `src/controllers/gerencia/useKpisVentas.ts` | Carga ventas y rotación del mismo período |
| `src/views/modules/gerencia/components/TablaRotacion.tsx` | Nuevo — tabla con estado por insumo |
| `src/views/modules/gerencia/GerenciaPage.tsx` | Sección "Rotación de inventario" |

### Pendiente

- [ ] Avisar a César y aplicar `0011_kpis_inventario.sql` en Supabase (SQL Editor).
- [ ] Verificar los números contra los movimientos reales de las pruebas de la Fase 4.
- [ ] Rentabilidad por plato: decidir de dónde sale el costo de un insumo (¿última compra? ¿promedio de las últimas compras?). Recién con eso se marca el Módulo 1 como ✅.

---

## 2026-10-13 — Segunda ronda de auditoría: Fases 0-3 y decisiones que solo vivían en memoria privada

Autor: Cesar (con Claude Code). Pedido explícito del usuario: revisar todas las fases anteriores (no solo 4/5) en busca de pendientes, mejoras, y funcionalidad simplificada a propósito para el MVP que nunca quedó escrita en ningún documento del repo.

### Hallazgo más importante: decisiones de producto viviendo solo en memoria de Claude

Dos decisiones ya confirmadas con el usuario en sesiones anteriores (personalización de plato diferida, 2026-10-07; delivery cobra primero, 2026-10-11) solo existían en el sistema de memoria local de Claude Code — invisibles para Pedro, para su IA, y para cualquiera que abra el repo sin esa memoria. Se trasladaron a `modelo-de-datos.md` (sección "Extensiones futuras") y `Roadmap_Construccion_MVP.md` (nota en Fase 2 Módulo 3, y la lista de "Funciones fuera de este plan").

### Otros hallazgos agregados al roadmap

- **Rol "Supervisor de sala" sin ninguna capacidad propia** (nuevo Módulo 7 de Fase 2): existe en el modelo de datos y en `rolesPorModulo.ts`, pero ninguna de las capacidades que le da `arquitectura.md` §4.10 por encima del mesonero está construida — anular un ítem ya enviado, transferir una mesa entre mesoneros, aplicar descuentos menores. Hoy solo hereda el acceso de mesonero/cocina, cero funcionalidad diferenciada.
- **Descuentos de precio a una cuenta** — nunca construidos en ningún lado; `CierreCuentaModal.tsx` solo tiene propina, no descuento.
- **Cliente de autopedido solo agrega, nunca edita/quita lo ya enviado** — pregunta abierta desde 2026-10-11, nunca resuelta ni agregada al roadmap como módulo.

### Verificación

Catálogo documental, sin cambios de código — no requiere `tsc`/`build`.

---

## 2026-10-13 — Fase 4, Módulo 6 (conteos físicos y conciliación)

Rama: `feature/fase4-insumos`. Autor: Cesar (con Claude Code). Último módulo pendiente de Fase 4, encontrado en la auditoría del roadmap del mismo día — `arquitectura.md` §4.3 ya lo pedía pero nunca tuvo módulo propio.

### Cómo funciona

Nueva pestaña "Conteo físico" en Inventario: lista los insumos tipo `exacto` de la sede con su stock teórico, y un campo para anotar lo contado físicamente. Al registrar, por cada insumo con diferencia se llama a `registrarAjusteManual` (el mismo de Movimientos, Fase 4 Módulo 4) con motivo fijo "Conteo físico" — `ajuste` si sobró, `merma` si faltó — así queda en el historial de movimientos con el mismo rastro que cualquier otro ajuste, no un sobreescritura silenciosa. Se elimina `actualizarStock()` de `inventarioService.ts`: era exactamente ese overwrite sin rastro, nunca se había conectado a ninguna pantalla, y quedó reemplazada por este flujo.

### Decisión de alcance

Solo insumos tipo `exacto`. Los `por_lote` ya se reconcilian abriendo/cerrando lotes — un ajuste agregado aquí movería `inventario_sede` sin tocar ningún lote específico, desincronizando el total de la suma real de lotes abiertos. Los `estimado` no se rastrean con precisión por decisión ya tomada (`arquitectura.md` sección 5).

### Verificación

Contra Supabase real: insumo con stock teórico 20 kg, contado 17 kg → se registra un movimiento `merma` de 3 kg con referencia "Conteo físico — fecha: teórico 20 kg, contado 17 kg" y `creado_por` del usuario que hizo el conteo; stock final 17 kg. `tsc`/`oxlint`/`build` limpios.

---

## 2026-10-13 — Limpieza: Reportes duplicado, código compartido, y auditoría del roadmap

Rama: `feature/fase4-insumos`. Autor: Cesar (con Claude Code).

### Para qué sirve

Pedro (con su asistente de IA) estaba construyendo el dashboard real de KPIs de gerencia (Fase 5, Módulo 1) cuando notó que administración ya tenía una pantalla de "Reportes" mostrando las mismas métricas, con datos 100% inventados. Revisado contra `arquitectura.md` §4.4/§4.10: los reportes financieros son de Gerencia, no de Administración — esa pantalla no era trabajo pendiente, era una duplicada con el rol equivocado.

### Qué se hizo

- Se elimina por completo `ReportesPage.tsx` / `useReportes.ts` / `mockData/reportes.ts`, el link del sidebar, la ruta en `App.tsx`, y los tipos que solo ella usaba (`IndicadoresReporte`, `VentaSemanalReporte`, `HoraPico`, `VentaCategoria`).
- `GerenciaPage.tsx` y `VentasPorDia.tsx` (de Pedro) importaban `ESTILOS_ADMIN`/`formatearMoneda`/`PanelCard` directo desde la carpeta de administración — acoplamiento cruzado que rompería gerencia ante cualquier cambio interno de administración. Se mueven a `src/views/components/ui/` (ya existía esa carpeta para piezas compartidas como `LoadingSpinner`/`ErrorMessage`) y los ~13 archivos de administración que ya los usaban pasan a importarlos desde ahí también.
- **No se tocó** el Panel/home de administración (sigue en mock): nunca tuvo un módulo propio asignado en el roadmap, en ninguna fase — conectarlo es trabajo nuevo, no una limpieza de duplicado.
- Se mergeó `main` (con el trabajo de Pedro ya integrado: dashboard de KPIs, migración `0010_kpis_ventas.sql`) dentro de la rama de Fase 4 antes de hacer la limpieza, sin conflictos de git — Pedro ya había renumerado su migración y no había colisión de tipos.
- Se audita todo el proyecto (`arquitectura.md`, `modelo-de-datos.md`, el roadmap, y el código real) para encontrar más casos del mismo patrón — ver los hallazgos marcados 🔲 directamente en `Roadmap_Construccion_MVP.md`: discrepancia entre la tabla `permisos_rol` (diseñada, nunca conectada) y el mapa estático `rolesPorModulo.ts` real; conteos físicos y conciliación (Fase 4) sin módulo asignado; alertas y excepciones de gerencia (Fase 5) sin módulo asignado; el rol "Supervisor de sala" sin acceso a ningún reporte pese a que `arquitectura.md` se lo da. Se agrega además una tabla nueva al inicio del roadmap listando las 4 pantallas de administración que siguen en mock (Panel, Pedidos, Personal, Configuración) y a qué fase/módulo le toca conectar cada una — para que no se repita la confusión de "esto parece un bug" con ninguna de ellas.

### Verificación

`tsc --noEmit` + `oxlint` + `npm run build` limpios sobre todo `src/` después del merge y de la limpieza; sin referencias colgantes a las rutas de import viejas (verificado con grep). Fast-forward merge a `main` sin tocar el trabajo de Pedro.

---

## 2026-10-12 — Fase 4 completa (administración e inventario real)

Rama: `feature/fase4-insumos`. Autor: Cesar (con Claude Code). Reparto acordado: Cesar toma Fase 4 completa, Pedro la Fase 5 (ver `CONTRIBUTING.md`). Los 5 módulos de la fase (insumos, descuento automático, lotes, movimientos, proveedores/compras) se construyeron en el orden 1 → 3 → 2 → 4 → 5 por dependencia real (el descuento automático para insumos `por_lote` necesita que ya existan lotes).

### Para qué sirve

Las 5 pantallas de inventario (`InsumosPage`, `LotesPage`, `MovimientosPage`, `ProveedoresPage`, `ComprasPage`) dejan de ser prototipos con datos inventados y quedan conectadas a Supabase real, siguiendo el mismo patrón "mock-first, luego real" del resto del proyecto.

### Hallazgo que cambió el alcance

El esquema real (`supabase/migrations/0002_esquema_inicial.sql`) resultó más simple que los mockups originales: no existían `stockMinimo`, `costoUnitario`, `categoria`, `fechaVencimiento`, separación teléfono/correo en proveedor, relación directa insumo↔proveedor, ni los estados `pendiente`/`rechazada` en órdenes de compra. Por cada campo se decidió explícitamente: agregar una columna nueva solo si la respaldaba `arquitectura.md` o una necesidad real de la UI (migración `0008_inventario_fase4.sql`: `stock_minimo`, `fecha_vencimiento`, `creado_por`, `creado_en`), o cortarlo y derivarlo de relaciones ya existentes.

### Cómo funciona, módulo por módulo

- **Insumos**: crear un insumo también crea su fila en `inventario_sede` en 0, para que el trigger de descuento siempre tenga dónde escribir. Eliminar propaga el error de Postgres si el insumo está en una receta (`on delete restrict`).
- **Descuento automático**: trigger `descontar_inventario_por_entrega` sobre `pedidos_items` (migración `0008`) — reacciona cuando la fila de "entregado" llega al servidor, sea por escritura directa o por la cola offline de PowerSync (inventario es online-only, no está en el esquema de PowerSync). Insumos `estimado` no se descuentan; `por_lote` descuenta del lote FEFO.
- **Lotes**: se agregó `fecha_vencimiento` (decisión confirmada con el usuario, FEFO real). Registrar un lote suma a `inventario_sede` vía el RPC atómico `incrementar_inventario_sede` (migración `0009`), para evitar condiciones de carrera si dos personas registran una entrada casi al mismo tiempo.
- **Movimientos**: lista real de entrada/salida/merma/ajuste (4 valores reales, no los 3 del mock). El ajuste manual (merma/corrección) queda con `creado_por` = quien lo hizo; los automáticos (trigger, compra recibida) quedan con `creado_por` nulo.
- **Proveedores y compras**: proveedor se simplificó a nombre + un campo de contacto libre. `ordenes_compra.estado` solo admite `borrador` → `aprobada` → `recibida` — no existe "rechazada": descartar un borrador lo elimina (cascada sobre sus items, decisión confirmada con el usuario). Al marcar una orden "recibida", cada item suma a `inventario_sede` con el mismo RPC atómico, deja un movimiento `entrada`, y si el insumo es `por_lote` abre un lote nuevo pidiendo la fecha de vencimiento en ese momento (no se asume ninguna).

### Decisiones tomadas

| Decisión | Por qué / alternativa |
| --- | --- |
| Orden de construcción 1 → 3 → 2 → 4 → 5, no el del roadmap | El descuento automático (Módulo 2) necesita lotes reales (Módulo 3) para poder descontar FEFO de insumos `por_lote`. |
| Trigger de Postgres para el descuento, no una llamada desde cocina | `pedidos_items.estado` se escribe offline vía PowerSync; `inventario_sede`/`lotes_insumo`/`movimientos_inventario` son online-only. El trigger reacciona cuando la fila llega al servidor, sin importar cuándo. |
| `incrementar_inventario_sede` como función atómica reusada en lotes y compras | Un `update cantidad_actual = cantidad_actual + X` directo desde el cliente sería una condición de carrera. |
| Sin columna `activo` en insumos/proveedores | La base ya protege con `on delete restrict`/`cascade` — mismo patrón que `menuService.eliminarCategoria`. |
| Sin estado "rechazada" en órdenes de compra | No existe en el esquema; descartar un borrador es simplemente eliminarlo. |
| Fecha de vencimiento del lote se pide al recibir una compra, no se asume | Igual que al registrar un lote a mano — nunca se inventa un dato que el usuario no dio. |

### Verificación

Cada módulo: `npx tsc --noEmit` + `npx oxlint` + `npm run build` limpios, y verificación contra Supabase real vía REST con la cuenta de prueba `administracion@prueba.com` — crear datos de prueba, confirmar el efecto esperado, limpiar. El Módulo 5 se verificó además end-to-end completo: borrador → aprobada → recibida con un insumo exacto y uno por lote, descarte de un borrador (cascada de items), y bloqueo real de borrado de un proveedor con órdenes asociadas.

### Pendiente

Ninguno dentro del alcance de esta fase. La prueba de red real de Fase 2 Módulo 4 (cortar internet de verdad en un navegador) sigue diferida a propósito, a pedir del usuario.

---

## 2026-10-11 — Fase 5, Módulo 1 (dashboard de KPIs — parte de ventas)

Rama: `feature/fase5-dashboard-kpis`. Autor: Pedro (con Claude Code). Reparto: Pedro tiene la Fase 5 completa; César, la Fase 4.

### Para qué sirve

Gerencia ve en `/gerencia` cómo van las ventas del restaurante: cuánto se vendió, cuántas cuentas, ticket promedio, propinas, ventas por día, platos y categorías más vendidos, horas de más venta, medios de pago y ventas por mesonero. Se elige el período: hoy, últimos 7 días, últimos 30 días o este mes.

### Cómo funciona

- La función `kpis_ventas(desde, hasta, sede)` (migración `0010`) agrega todo en el servidor y devuelve un solo JSON. El navegador no baja las filas una por una.
- Corre con los permisos de quien la llama (`security invoker`), así que RLS sigue separando restaurantes. Gerencia ve todas las sedes de su tenant; el parámetro de sede queda listo para el Módulo 3 (multi-sede). La gente sin sesión (anon) no puede llamarla.
- Una venta es una cuenta cerrada en el período. `pagos_cierre` no guarda fecha, así que el período se toma de `sesiones_mesa.cerrada_en`. Días y horas se calculan en la zona horaria de cada sede.
- "Ventas" es la suma de `pagos_cierre.monto` (subtotal, sin propina); las propinas van aparte.
- Platos y categorías salen de `pedidos_items` de esas cuentas, a su precio congelado. Se excluyen los `por_aprobar` (un pedido por QR que nunca se confirmó no se vendió).
- Los días sin ventas aparecen en cero en el gráfico, para que un día flojo se vea.

### Decisiones tomadas

| Decisión | Por qué / alternativa |
| --- | --- |
| El dashboard va en `/gerencia` | Estaba vacía y solo la ve gerencia. Administración → Reportes (diseño de César con datos de prueba) queda como está hasta decidir qué debe ver administración. |
| Solo ventas por ahora | Rentabilidad por plato necesita el costo de los insumos y rotación necesita movimientos de inventario; los dos llegan con la Fase 4. El Módulo 1 no se marca ✅ hasta agregarlos. |
| Agregar en una función SQL, no en el navegador | Un mes de pedidos son miles de filas; el servidor devuelve solo los totales. |
| El mesonero de una venta es el asignado a la mesa | `sesiones_mesa.mesonero_id`, no quien cobró (`pagos_cierre.cerrado_por`). Las mesas por QR nunca aprobadas salen como "Sin mesonero". |
| Gráficos con barras de CSS, sin librería | Mismo estilo que la pantalla de reportes de César y sin dependencias nuevas. |

### Archivos

| Archivo | Cambio |
| --- | --- |
| `supabase/migrations/0010_kpis_ventas.sql` | Nuevo — función `kpis_ventas` |
| `src/models/types/kpis.ts`, `src/models/types/index.ts` | Tipos de los KPIs |
| `src/models/services/kpisService.ts` | Nuevo — `fetchKpisVentas` |
| `src/controllers/gerencia/useKpisVentas.ts` | Nuevo — período, carga y días completos |
| `src/views/modules/gerencia/GerenciaPage.tsx` | Dashboard (antes era un título vacío) |
| `src/views/modules/gerencia/components/ListaBarras.tsx`, `VentasPorDia.tsx` | Nuevos — gráficos de barras |

### Pendiente

- [x] Numeración: César ya había usado `0008` y `0009` en la Fase 4, así que esta migración quedó como `0010_kpis_ventas.sql`. El contenido es el mismo que Pedro aplicó en el SQL Editor el 2026-10-12.
- [x] Verificado el 2026-10-12 con la cuenta de gerencia, últimos 30 días, comparando la función contra un cálculo directo de las tablas: 6 cuentas cerradas, $165.50 de ventas, $24.83 de propinas, ticket promedio $27.58, 19 unidades. Ventas por día, medio de pago, mesonero, categoría y top de platos suman exactamente $165.50. Sin sesión (anon), la función queda bloqueada. Pedro también lo revisó en `/gerencia`.
- [ ] Agregar rentabilidad por plato y rotación de inventario cuando la Fase 4 esté en `main`; recién ahí marcar el Módulo 1 como ✅.

---

## 2026-10-11 — Fase 3, Módulo 3 (sesión de mesa compartida)

Rama: `feature/fase3-mesa-compartida`. Autor: Pedro (con Claude Code). Reparto acordado: César hizo Fase 3 Módulo 2 (`enviar_pedido_autopedido`, migración 0004) y tiene la prueba de Fase 2 Módulo 4; Pedro hace este módulo. Se mezcló con el ajuste de César de aprobación del mesonero (`por_aprobar`, migración 0005): por eso la migración de este módulo es la `0006`.

### Para qué sirve

Mesonero y cliente ven el mismo pedido de la mesa: lo que cargó el mesonero y lo que pidió el cliente por QR, con su estado de cocina. Las mesas que abre el cliente con el QR se distinguen en el mapa y se atienden aprobando su pedido. El cierre y el pago siguen siendo siempre del mesonero; el cliente no tiene ningún botón para eso.

### Cómo funciona

- **Cliente (pestaña "Tu pedido"):** arriba, "Ya pedido en la mesa", con cada ítem, su estado (Esperando al mesonero / En espera / En preparación / Listo / Entregado), si se pidió por QR o con el mesonero, y el total de la mesa. Abajo, "Por enviar" (el carrito del Módulo 2). Se lee con la función pública `pedido_publico_mesa` (migración 0006) cada 5 segundos mientras la pestaña está visible, y al instante después de enviar. Si el mesonero cierra la cuenta mientras el cliente mira, aparece "Tu mesonero ya cerró la cuenta".
- **Mesonero, mapa:** una mesa con sesión abierta y sin mesonero (abierta por QR) aparece en celeste con la etiqueta "QR" y tiene su filtro "Por QR sin atender". Al seleccionarla, el panel muestra los platos por aprobar y el botón "Aprobar y enviar a cocina" (la aprobación de César: pasa los platos a cocina y deja al mesonero asignado). Unificado a propósito: antes había un botón "Atender esta mesa" aparte que hacía casi lo mismo. Si la mesa no tiene nada por aprobar, aparece "Tomar esta mesa". Si el mesonero toca "Abrir mesa" en una mesa que el cliente ya abrió, se toma esa sesión en vez de crear una segunda.
- **Mesonero, pantalla de pedido:** los ítems que pidió el cliente llevan la etiqueta "QR".
- **Cocina:** donde decía "Sin asignar" ahora dice "Sin mesonero (pedido por QR)".
- **Base de datos:** un trigger pone `sesiones_mesa.origen = 'hibrido'` cuando pidieron los dos (sesión del mesonero + ítem por QR, o sesión por QR + ítem del mesonero). `hibrido` ya existía en el esquema pero nada lo asignaba.

### Decisiones tomadas

| Decisión | Por qué / alternativa |
| --- | --- |
| El cliente se actualiza consultando cada 5 s, no con Realtime | El cliente no tiene sesión, y Realtime respeta RLS: no puede suscribirse a `pedidos_items`. Alternativa: un canal Realtime Broadcast por mesa disparado desde Postgres; más piezas para el mismo resultado. El mesonero sí lo ve al instante (PowerSync). |
| El cliente solo puede agregar, no editar ni quitar lo ya enviado | Cambiar o cancelar algo que cocina ya recibió lo decide el mesonero. No estaba decidido en los documentos; se puede revisar. |
| El cliente no ve nombres de mesoneros | `pedido_publico_mesa` solo dice "por QR" o "con el mesonero". Cualquiera con el enlace de la mesa ve su pedido actual (consecuencia de que el QR lleve el id de la mesa). |
| Una mesa por QR se atiende aprobando su pedido | Decidido al mezclar con la aprobación de César: un solo camino en vez de "Atender" + "Aprobar". La aprueba cualquier mesonero de la sede; sin internet, si dos la toman a la vez gana la última escritura que llegue al servidor. |
| `origen = 'hibrido'` con trigger, no dentro de las funciones | Cubre ambos caminos, incluidos pedidos del mesonero que suben tarde desde la cola offline, sin tocar `enviar_pedido_autopedido` de César. |
| Una sesión abierta manda sobre `mesas.estado` en el mapa | `enviar_pedido_autopedido` solo pasa la mesa a ocupada si estaba libre; si el cliente pide en una mesa "por limpiar", el mapa igual la muestra como abierta por QR. |

### Archivos

| Archivo | Cambio |
| --- | --- |
| `supabase/migrations/0006_mesa_compartida.sql` | Nuevo — función `pedido_publico_mesa` + trigger `marcar_sesion_hibrida` |
| `src/models/types/autopedido.ts`, `src/models/types/index.ts` | Tipos del pedido compartido |
| `src/models/services/menuPublicoService.ts` | `fetchPedidoCompartidoMesa` |
| `src/controllers/autopedido/usePedidoCompartido.ts` | Nuevo — lee el pedido de la mesa cada 5 s |
| `src/controllers/autopedido/useAutopedido.ts` | Usa el pedido compartido y lo refresca al enviar |
| `src/views/modules/autopedido/components/PedidoMesa.tsx` | "Ya pedido en la mesa" + "Por enviar" |
| `src/views/modules/autopedido/components/EncabezadoAutopedido.tsx`, `AutopedidoPage.tsx` | Aviso de mesa compartida; pasa el pedido compartido |
| `src/models/services/sesionMesaService.ts` | `atenderMesa` (solo para no abrir una segunda sesión) |
| `src/views/modules/mesoneros/components/MapaMesas.tsx`, `MesaCard.tsx`, `DetalleMesaPanel.tsx` | Estado "Pedido por QR sin atender", filtro y panel con "Aprobar y enviar a cocina" |
| `src/controllers/pedido/usePedidos.ts`, `src/views/modules/pedidos/components/ResumenPedido.tsx` | Etiqueta "QR" en ítems del cliente |
| `src/views/modules/cocina/components/TableroCocina.tsx`, `OrderDetailModal.tsx` | "Sin mesonero (pedido por QR)" |

### Pendiente

- [ ] Aplicar `0006_mesa_compartida.sql` en Supabase (SQL Editor).
- [ ] Probar en vivo con dos navegadores: cliente pide por QR → ve "Esperando al mesonero" → el mesonero ve la mesa en celeste → aprueba el pedido → agrega un plato → el cliente ve ambos ítems con su estado → cocina avanza el estado → el cliente lo ve cambiar → el mesonero cierra la cuenta → el cliente ve "ya cerró la cuenta". Confirmar en Supabase que la sesión quedó con `origen = 'hibrido'`.
- [ ] Riesgo conocido, sin resolver: si el mesonero abre la mesa **sin internet** justo cuando el cliente la abre por QR, quedan dos sesiones abiertas para la misma mesa. No se agregó un índice único porque haría fallar la subida offline del mesonero y bloquearía su cola de PowerSync (ver nota del Módulo 4 de la Fase 2).
- [x] Migración `0006` aplicada y prueba en vivo hecha por Pedro el 2026-10-11. Confirmado en Supabase: la sesión de prueba de la mesa 3 quedó `origen = 'hibrido'` y con el mesonero asignado al aprobar.
- [ ] Marcar Fase 3, Módulo 3 como ✅ en el roadmap cuando estén resueltos los bugs de abajo.

### Bugs encontrados en la prueba (para revisar después)

- [x] **"Ya pedido en la mesa" (vista del cliente):** resuelto (2026-10-11), con más detalle del usuario — el problema era de UX, no un error de datos: con nada pedido todavía, se veían dos mensajes de vacío por separado ("Ya pedido en la mesa" y "Por enviar"). Ahora, cuando no hay nada en ninguna de las dos (y la cuenta no está cerrada), se muestra una sola pantalla invitando a ir al menú.
- [x] **Cocina no siempre muestra los pedidos por QR:** resuelto (2026-10-11), reproducido con más detalle del usuario. No era un bug de sincronización ni de cocina — cocina mostraba correctamente solo lo aprobado (por diseño, `por_aprobar` no debe verse ahí). El problema real: una mesa ya asignada a un mesonero no mostraba ningún aviso propio cuando llegaba un pedido nuevo por QR — solo existía el banner general de arriba del mapa, desconectado de qué mesa era. Se agregó una campanita en la `MesaCard` misma cuando tiene un ticket pendiente de aprobar.
- [x] **Falta impedir cerrar la cuenta con platos sin terminar:** resuelto (2026-10-11). Decisión confirmada con el usuario: en mesas se prepara primero y se cobra al final (al revés que en delivery, cuando se construya — anotado en memoria para esa fase). `CierreCuentaModal` bloquea "Confirmar y cerrar mesa" si algún ítem de la sesión sigue en `pendiente` o `en_preparacion`; cuenta como terminado `listo` o `entregado`. El botón "cancelar plato" para insumos agotados queda para después, como función de administración.
- [x] **Pedido por QR después de cerrar la cuenta:** resuelto (2026-10-11). Migración `0007_autopedido_mesa_disponible.sql`: `enviar_pedido_autopedido` solo abre una sesión nueva si la mesa está `libre` — rechaza con "Esta mesa no está disponible para pedir en este momento" si está `por_limpiar`. El celular del cliente también deshabilita "Enviar pedido" una vez que ve "tu mesonero ya cerró la cuenta". Verificado contra Supabase real: rechaza en `por_limpiar`, acepta en `libre`.

---

## 2026-10-09 — Fase 3, Módulo 1 (menú público por QR) + disponibilidad y precio por sede

Rama: `feature/fase3-autopedido-qr`. Autor: Pedro (con Claude Code).

### Estado de partida

- `main` estaba en `32c9048` (trabajo de César: mesas, pedidos, cocina y cierre de cuenta reales).
- Fase 2: módulos 1, 2, 3, 5 y 6 listos. **Módulo 4 (sincronización de comandas) sigue pendiente**: falta la prueba real de cortar internet, tomar pedidos, reconectar y confirmar en Supabase que no hay duplicados. Se decidió avanzar a la Fase 3 y hacer esa prueba cuando ambos estén disponibles.
- A vigilar en esa prueba: en `src/lib/powerSyncClient.ts` (`uploadData`), si Supabase rechaza un pedido de forma permanente (permiso o dato inválido), ese error frena la subida de todos los que vienen detrás.

### 1. Menú público por mesa (Fase 3, Módulo 1)

**Para qué sirve:** el cliente escanea el QR de su mesa y ve en su celular el menú real del restaurante, sin cuenta ni sesión. Puede armar un carrito, pero todavía no lo envía a cocina (eso es el Módulo 2).

**Cómo funciona:**

1. El QR apunta a `/autopedido/<id de la mesa>`.
2. La app revisa que el id tenga forma válida; si no, muestra "Este QR no es válido".
3. Llama a la función `menu_publico_mesa(id)` en Supabase. Es `security definer`: el cliente nunca lee tablas directo (RLS se lo impide, a propósito) y la función solo devuelve nombre del restaurante, mesa, categorías y platos de ese restaurante. Nunca pedidos, usuarios ni inventario.
4. Si la mesa no existe o el restaurante no está activo, devuelve `null` → "Este QR no es válido". Si no hay internet → "No pudimos cargar el menú".
5. El carrito vive solo en memoria del celular.

**Administración → Mesas:** al seleccionar una mesa aparece "Enlace del QR" con botones "Copiar enlace" y "Abrir vista del cliente".

### 2. Disponibilidad y precio por sede

**Para qué sirve:** cada sede puede ocultar un plato o cambiarle el precio, usando la tabla `menu_item_sede` que ya existía en el esquema pero no se usaba.

**Cómo funciona:**

- **Administración → Menú:** al abrir un plato hay una sección "En esta sede" con la casilla "Disponible" y un "Precio en esta sede" opcional (vacío = precio general). Se guarda con un upsert sobre `unique(menu_item_id, sede_id)` y aplica a la sede del usuario de administración.
- **Mesonero:** el menú se lee con un `left join` a `menu_item_sede` en la base local de PowerSync, así que sigue funcionando sin internet.
- **Cliente por QR:** la función `menu_publico_mesa` aplica el mismo criterio. Cliente y mesonero ven siempre los mismos platos y precios.
- De paso: los ítems ya enviados a cocina toman su nombre directo de `menu_items`, así un plato que se oculta después de pedirlo no aparece como "Plato".

### Decisiones tomadas

| Decisión | Por qué / alternativa |
| --- | --- |
| El QR lleva el id de la mesa, no un código aparte | Más simple, sin cambiar la tabla `mesas`. Contra: un QR filtrado no se puede invalidar sin borrar la mesa. Alternativa descartada: columna `qr_token` regenerable. |
| Enlace, no imagen de QR | Para imprimir se pasa el enlace por cualquier generador de QR. Generar la imagen en la app requiere una librería nueva. |
| Sin proteína ni extras en el autopedido | Igual que el mesonero: cantidad + nota. Vuelven cuando exista una tabla para guardarlos. |
| La página del cliente necesita internet | El celular del cliente no tiene sesión ni base local. La regla offline aplica a mesoneros, cocina y mesas. |
| Plato no disponible se oculta (no se muestra "agotado") | Más simple para el cliente. |
| Sin fila en `menu_item_sede` = disponible a precio general | Los 45 platos actuales siguen igual sin configurar nada. |
| Un pedido enviado conserva su precio | `pedidos_items.precio_unitario` se guarda al pedir; cambiar el precio de la sede solo afecta pedidos nuevos. |

### Archivos

| Archivo | Cambio |
| --- | --- |
| `supabase/migrations/0003_menu_publico_mesa.sql` | Nuevo — función pública `menu_publico_mesa` |
| `src/models/services/menuPublicoService.ts` | Nuevo — llama a la función |
| `src/controllers/autopedido/useAutopedido.ts` | Reescrito — menú real, carrito, estados de carga/error |
| `src/models/types/autopedido.ts`, `src/models/types/index.ts` | Tipos nuevos del menú público |
| `src/views/modules/autopedido/*` | Página y componentes con datos reales; `fondoPlato.ts` nuevo |
| `src/controllers/autopedido/mockData/autopedido.ts` | Borrado — datos de prueba |
| `src/App.tsx` | Ruta `/autopedido/:mesaId` |
| `src/views/modules/administracion/MesasAdminPage.tsx` | Enlace del QR por mesa |
| `src/models/services/menuService.ts` | `fetchMenuItemSede`, `guardarMenuItemSede` |
| `src/controllers/administracion/useDisponibilidadSede.ts` | Nuevo — estado de "En esta sede" |
| `src/views/modules/administracion/components/DisponibilidadSede.tsx` | Nuevo — sección "En esta sede" |
| `src/views/modules/administracion/components/PlatoDetallePanel.tsx` | Muestra "En esta sede" |
| `src/controllers/pedido/usePedidos.ts` | Menú del mesonero respeta `menu_item_sede`; nombres de ítems enviados vía join |

### Problema resuelto en el entorno (no está en el código)

Las mesas no aparecían en la vista del mesonero en la máquina de Pedro. Causa: `VITE_POWERSYNC_URL` en `.env` terminaba en `/` y PowerSync rechaza esa dirección ("A trailing forward slash "/" was found in the fetchCredentials endpoint"), así que nunca conectaba. Se quitó la barra final de `VITE_SUPABASE_URL` y `VITE_POWERSYNC_URL`. El `.env` no se sube a GitHub: **revisen que el suyo no termine en `/`.**

### Pendiente

- [x] Aplicar `0003_menu_publico_mesa.sql` en Supabase. Hecho el 2026-10-09 por el SQL Editor, con la versión que incluye `menu_item_sede` (verificado con `pg_get_functiondef`; la función responde 13 categorías y 45 platos para la mesa 3, y `null` para una mesa inexistente).
- [ ] Registrar `0002` y `0003` en el historial de migraciones de Supabase. Ambas se aplicaron por el SQL Editor, así que un `supabase db push` intentaría correrlas de nuevo. Antes de usar `db push`: `supabase migration repair --status applied 0002` y `... 0003`. Ojo: desde la red de Pedro el CLI no logra conectarse a la base (la conexión al pooler de Postgres da timeout), así que `migration list`, `repair` y `db push` hay que correrlos desde otra red o hacerlo César.
- [ ] Probar el menú público: Administración → Mesas → "Abrir vista del cliente" en incógnito.
- [ ] Probar "En esta sede": desmarcar un plato y confirmar que desaparece para mesonero y cliente. Depende de que `menu_item_sede` esté en las Sync Rules de PowerSync (la guía la incluye, no se pudo confirmar porque la tabla estaba vacía).
- [ ] Marcar Fase 3, Módulo 1 como ✅ en el roadmap cuando esté probado.
- [ ] Prueba del Módulo 4 de la Fase 2.
- [ ] Siguiente: Fase 3, Módulo 2 — enviar el pedido del cliente a cocina mediante una función segura.
