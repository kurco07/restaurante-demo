# Registro de cambios

Seguimiento de lo que se cambia en el proyecto, más reciente primero. Cada entrada dice qué se hizo, para qué, qué decisiones se tomaron y qué queda pendiente. Complementa a `Roadmap_Construccion_MVP.md` (qué falta construir) con el detalle de qué se construyó y cómo.

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
