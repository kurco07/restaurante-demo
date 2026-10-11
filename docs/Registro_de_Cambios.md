# Registro de cambios

Seguimiento de lo que se cambia en el proyecto, más reciente primero. Cada entrada dice qué se hizo, para qué, qué decisiones se tomaron y qué queda pendiente. Complementa a `Roadmap_Construccion_MVP.md` (qué falta construir) con el detalle de qué se construyó y cómo.

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
