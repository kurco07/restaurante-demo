# Pendientes: manejo de errores y estados de carga (Fase 8, Módulo 2)

Revisión hecha por Pedro con Claude Code el **2026-11-02**, sobre `main` (`69419da`). **Todavía no se arregló nada de esta lista**: queda anotada para hacerla después.

Qué se buscó en todo `src/`:
- errores que nadie ve;
- acciones que pueden fallar en silencio;
- pantallas sin "cargando", o que confunden "cargando" con "vacío";
- mensajes técnicos que le llegarían al usuario.

Va ordenada de más a menos urgente.

---

## Crítico: afecta el servicio en el local (mesonero y cocina)

### 1. No hay protección contra pantalla en blanco
- **Problema:** la app no tiene ningún Error Boundary (`componentDidCatch`). Si cualquier componente falla al dibujarse, por ejemplo con un dato inesperado, **toda la app queda en blanco**, en pleno servicio y sin forma de volver salvo recargando.
- **Arreglo propuesto:** una red global y otra por módulo (mesonero, cocina, administración, gerencia, QR), con el mensaje "Algo falló, toca para recargar". No tiene que perder lo guardado sin internet.

### 2. Cambios que el servidor rechaza sin que nadie se entere
- **Dónde:** `src/lib/powerSyncClient.ts`, `uploadData`.
- **Problema:** cuando PowerSync sube un cambio y la base lo rechaza por una regla (errores `P0001` de los triggers, por ejemplo una anulación o una transferencia que no corresponde), el conector **lo descarta** y solo deja un `console.warn`. El usuario cree que se hizo, y al sincronizar su copia vuelve atrás sin explicación.
- **Arreglo propuesto:** guardar esos rechazos y mostrarle al usuario "El servidor no aceptó este cambio: [motivo]".

### 3. Acciones del mesonero y de cocina que fallan sin decir nada
| Acción | Archivo | Qué pasa si falla |
|---|---|---|
| Iniciar preparación / Marcar listo / Entregar | `src/controllers/cocina/useCocina.ts` (`avanzarEstado`) | Solo `try/finally`: el botón vuelve como si nada |
| "Entendido" en anulaciones | `useCocina.ts` (`confirmarAnulados`) y `TableroCocina.tsx` (`void`) | Sin manejo de errores |
| Enviar a cocina | `src/controllers/pedido/usePedidos.ts` (`enviarACocina`) | Solo `try/finally`: el carrito queda sin ningún mensaje |
| Abrir mesa, atender, marcar libre | `src/views/modules/mesoneros/components/MapaMesas.tsx` | Sin ningún `try` |
| Anular plato, anular cuenta, transferir mesa | `AnularItemModal.tsx`, `AnularCuentaModal.tsx`, `TransferirMesaModal.tsx` | `try` sin mensaje de error: la ventana no dice nada |

**Arreglo propuesto:** un aviso estándar de error en cada una, y que los botones no queden en un estado engañoso.

### 4. "Cargando" que parece "vacío"
- **Problema:** en un dispositivo nuevo, o después de borrar los datos del sitio, PowerSync tarda en bajar la información. Mientras tanto, cocina muestra **"No hay pedidos pendientes"** (`TableroCocina.tsx`) y el **mapa de mesas sale vacío**, como si no hubiera nada.
- Ninguna pantalla distingue "todavía sincronizando" de "de verdad vacío", aunque PowerSync lo informa (`hasSynced` en el estado de sincronización).
- **Arreglo propuesto:** un estado "Sincronizando por primera vez…" en mesonero, cocina y mis pedidos.

### 5. "Cargando tu perfil…" infinito
- **Dónde:** `src/views/components/UsuarioProvider.tsx`.
- **Problema:** si la fila del perfil nunca llega a la copia local (pasó con la copia de PowerSync trabada en la prueba del Módulo 2 de la Fase 6), la app queda cargando para siempre. El campo `error` del contexto **siempre es `null`**.
- **Arreglo propuesto:** un límite de tiempo, un mensaje claro y un botón **"Reiniciar datos de este dispositivo"**. Es el mismo arreglo que hubo que hacer a mano: F12, Application, Clear site data.

### 6. Versión vieja abierta sin aviso
- **Problema:** es la PWA (`vite.config.ts`, `registerType: 'autoUpdate'`). Cuando sale una versión nueva, el dispositivo sigue mostrando la anterior hasta cerrar las pestañas o recargar, a veces dos veces. Pasó en la prueba del 2026-10-30: cocina seguía mostrando "1× Carne extreme" dos veces con el arreglo ya publicado.
- **Arreglo propuesto:** un aviso de **"Hay una versión nueva, toca para actualizar"**.

---

## Importante: pantallas de gestión (siempre necesitan internet)

### 7. Administración → Menú
- **Dónde:** `src/views/modules/administracion/components/MenuAdmin.tsx`.
- **Problema:** **9 operaciones sin manejo de errores**: crear, editar y borrar categorías y platos, agregar y quitar líneas de receta, y crear insumos desde la receta. Si falla guardar (nombre repetido, permisos, red), no se muestra nada.

### 8. Login y registro
- `src/views/modules/login/LoginPage.tsx`: después de iniciar sesión, la lectura del rol (`auth.getUser` y luego `usuarios`) no tiene manejo de errores.
- `src/views/modules/registro/RegistroPage.tsx`: si la red se cae en medio del registro, el botón puede quedar trabado en "Creando…".

### 9. Mensajes técnicos crudos
- **Problema:** varias pantallas muestran el error tal cual llega de Supabase, por ejemplo *"duplicate key value violates unique constraint"* o *"new row violates row-level security policy"*.
- **Arreglo propuesto:** una función común que traduzca los errores conocidos a frases para el usuario, y un mensaje genérico para el resto.

### 10. Sin aviso de "sin conexión" en administración y gerencia
- **Problema:** esos módulos no funcionan offline, a propósito, pero sin red cada pantalla falla por su lado con un "Failed to fetch".
- **Arreglo propuesto:** un aviso general, por ejemplo "Sin conexión: esta sección necesita internet".

---

## Para el piloto, aunque no es manejo de errores

### 11. Pantallas de administración con datos de mentira
Todavía usan datos de ejemplo (`src/controllers/administracion/mockData`):
- **Panel de inicio** de administración: `usePanelAdmin.ts`, en `AdministracionPage.tsx`;
- **Pedidos**: `usePedidosAdmin.ts`, en `PedidosAdminPage.tsx`;
- **Personal**, la lista (`usePersonal.ts`). **Las invitaciones de César ya son reales.**
- Parte de **Configuración** (`useConfiguracion.ts`). **La sección de marca ya es real.**

Un restaurante del piloto vería números falsos. Hay que decidir con César si se conectan o se marcan como "próximamente" antes del piloto.

---

## Lo que ya está bien (no hace falta tocar)
- Las pantallas de **gerencia** (ventas, rentabilidad, inventario, reporte por día, sedes, alertas, sugerencias IA) muestran carga y error.
- **Sugerencias de compra** y la mayoría de los formularios de **administración** (insumos, compras, proveedores, lotes, mesas, conteo físico, movimientos) ya muestran sus errores.
- El **autopedido QR** quedó bien con los arreglos del 2026-10-30: copia local, envío pendiente y reintentos solos.

---

## Orden propuesto para cuando se haga

1. **Piezas comunes**, que sirven para todo lo demás:
   - la red contra pantalla en blanco (1);
   - un aviso estándar de error y de éxito;
   - un traductor de errores (9);
   - el estado de "sincronizando por primera vez" (4);
   - el aviso de versión nueva (6).
2. **Mesonero y cocina:** los puntos 2, 3 y 5.
3. **Administración y entrada:** los puntos 7, 8 y 10.
4. **Decidir con César** qué hacer con las pantallas de datos de mentira (11).

Cuando se termine, marcar el Módulo 2 de la Fase 8 con ✅ en el Roadmap y anotarlo en `Registro_de_Cambios.md`.
