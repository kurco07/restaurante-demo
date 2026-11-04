# Pendientes: manejo de errores y estados de carga (Fase 8, Módulo 2)

Revisión hecha por Pedro con Claude Code el **2026-11-02**, sobre `main` (`69419da`).

**Avance (2026-11-04, rama `feature/fase8-errores-carga`):** hechos los puntos **1 a 10**; falta probarlos en el navegador. El **11** no se hace aquí: César está quitando todos los datos de prueba de la app. Cada punto dice ✅ y qué quedó.

Qué se buscó en todo `src/`:
- errores que nadie ve;
- acciones que pueden fallar en silencio;
- pantallas sin "cargando", o que confunden "cargando" con "vacío";
- mensajes técnicos que le llegarían al usuario.

Va ordenada de más a menos urgente.

---

## Crítico: afecta el servicio en el local (mesonero y cocina)

### 1. No hay protección contra pantalla en blanco ✅
- **Problema:** la app no tiene ningún Error Boundary (`componentDidCatch`). Si cualquier componente falla al dibujarse, por ejemplo con un dato inesperado, **toda la app queda en blanco**, en pleno servicio y sin forma de volver salvo recargando.
- **Arreglo propuesto:** una red global y otra por módulo (mesonero, cocina, administración, gerencia, QR), con el mensaje "Algo falló, toca para recargar". No tiene que perder lo guardado sin internet.
- **✅ Hecho:** `src/views/components/ErrorBoundary.tsx`. Hay una red global (`main.tsx`) y `RedDeModulo` en mesonero, cocina y gerencia (alrededor del contenido, así la barra sigue usable), en cada pantalla de administración, en super-admin y en el autopedido. Muestra "Algo falló en esta pantalla" con **Recargar** y **Volver a intentar**, y se reinicia sola al cambiar de pantalla. Recargar no pierde nada: la base local y los carritos quedan guardados.

### 2. Cambios que el servidor rechaza sin que nadie se entere ✅
- **Dónde:** `src/lib/powerSyncClient.ts`, `uploadData`.
- **Problema:** cuando PowerSync sube un cambio y la base lo rechaza por una regla (errores `P0001` de los triggers, por ejemplo una anulación o una transferencia que no corresponde), el conector **lo descarta** y solo deja un `console.warn`. El usuario cree que se hizo, y al sincronizar su copia vuelve atrás sin explicación.
- **Arreglo propuesto:** guardar esos rechazos y mostrarle al usuario "El servidor no aceptó este cambio: [motivo]".
- **✅ Hecho:** el conector sigue descartando el cambio (reintentarlo trabaría la cola), pero ahora muestra un **aviso fijo**, que no se va solo: "El servidor no aceptó un cambio en un plato hecho en este dispositivo: [motivo de la regla]".
- **Queda anotado, sin tocar:** si la base rechaza por **permisos** (RLS, código `42501`) en vez de por una regla, el cambio se sigue reintentando y la cola de ese dispositivo queda trabada ("N por subir" que no baja). No debería pasar con el uso normal; si pasa, hay que decidir si también se descarta con aviso.

### 3. Acciones del mesonero y de cocina que fallan sin decir nada ✅
| Acción | Archivo | Qué pasa si falla |
|---|---|---|
| Iniciar preparación / Marcar listo / Entregar | `src/controllers/cocina/useCocina.ts` (`avanzarEstado`) | Solo `try/finally`: el botón vuelve como si nada |
| "Entendido" en anulaciones | `useCocina.ts` (`confirmarAnulados`) y `TableroCocina.tsx` (`void`) | Sin manejo de errores |
| Enviar a cocina | `src/controllers/pedido/usePedidos.ts` (`enviarACocina`) | Solo `try/finally`: el carrito queda sin ningún mensaje |
| Abrir mesa, atender, marcar libre | `src/views/modules/mesoneros/components/MapaMesas.tsx` | Sin ningún `try` |
| Anular plato, anular cuenta, transferir mesa | `AnularItemModal.tsx`, `AnularCuentaModal.tsx`, `TransferirMesaModal.tsx` | `try` sin mensaje de error: la ventana no dice nada |

**Arreglo propuesto:** un aviso estándar de error en cada una, y que los botones no queden en un estado engañoso.

**✅ Hecho:** todas muestran el aviso estándar (`avisar.error`, abajo al centro de la pantalla) con qué falló y por qué. Si falla "Enviar a cocina", el carrito queda como estaba para volver a enviarlo.

### 4. "Cargando" que parece "vacío" ✅
- **Problema:** en un dispositivo nuevo, o después de borrar los datos del sitio, PowerSync tarda en bajar la información. Mientras tanto, cocina muestra **"No hay pedidos pendientes"** (`TableroCocina.tsx`) y el **mapa de mesas sale vacío**, como si no hubiera nada.
- Ninguna pantalla distingue "todavía sincronizando" de "de verdad vacío", aunque PowerSync lo informa (`hasSynced` en el estado de sincronización).
- **Arreglo propuesto:** un estado "Sincronizando por primera vez…" en mesonero, cocina y mis pedidos.
- **✅ Hecho:** `useSincronizado` lee `hasSynced`. Mientras el dispositivo no termine su primera sincronización, el tablero de cocina, Entregados, Mis pedidos y el mapa de mesas dicen "Sincronizando por primera vez…" en vez de "no hay nada". Si el mapa ya sincronizó y la sede no tiene mesas, ahora dice que administración las agrega.

### 5. "Cargando tu perfil…" infinito ✅
- **Dónde:** `src/views/components/UsuarioProvider.tsx`.
- **Problema:** si la fila del perfil nunca llega a la copia local (pasó con la copia de PowerSync trabada en la prueba del Módulo 2 de la Fase 6), la app queda cargando para siempre. El campo `error` del contexto **siempre es `null`**.
- **Arreglo propuesto:** un límite de tiempo, un mensaje claro y un botón **"Reiniciar datos de este dispositivo"**. Es el mismo arreglo que hubo que hacer a mano: F12, Application, Clear site data.
- **✅ Hecho:** si a los 15 s no llegó el perfil, `UsuarioProvider` llena `error` y se muestra `PerfilNoCargado` con dos botones:
  - **Reiniciar datos de este dispositivo:** borra la copia local de PowerSync y la vuelve a bajar. La sesión y los carritos no se tocan. Si hay cambios sin subir, pide confirmación porque se perderían. Sin internet queda desactivado y dice que hay que conectarse.
  - **Cerrar sesión.**

### 6. Versión vieja abierta sin aviso ✅
- **Problema:** es la PWA (`vite.config.ts`, `registerType: 'autoUpdate'`). Cuando sale una versión nueva, el dispositivo sigue mostrando la anterior hasta cerrar las pestañas o recargar, a veces dos veces. Pasó en la prueba del 2026-10-30: cocina seguía mostrando "1× Carne extreme" dos veces con el arreglo ya publicado.
- **Arreglo propuesto:** un aviso de **"Hay una versión nueva, toca para actualizar"**.
- **✅ Hecho:** la PWA pasó a `registerType: 'prompt'`. `AvisoVersionNueva.tsx` muestra una franja arriba con "Hay una versión nueva de la app" y el botón **Actualizar**. No recarga sola, para no cortarle la pantalla a nadie en pleno servicio. Busca versión nueva al abrir y cada 30 min.
- **Ojo, una sola vez:** los dispositivos con la versión de antes todavía no tienen el aviso. Para recibir **esta** versión hay que cerrar las pestañas o recargar como antes. A partir de ahí, ya avisa.

---

## Importante: pantallas de gestión (siempre necesitan internet)

### 7. Administración → Menú ✅
- **Dónde:** `src/views/modules/administracion/components/MenuAdmin.tsx`.
- **Problema:** **9 operaciones sin manejo de errores**: crear, editar y borrar categorías y platos, agregar y quitar líneas de receta, y crear insumos desde la receta. Si falla guardar (nombre repetido, permisos, red), no se muestra nada.
- **✅ Hecho:** revisando de cerca, crear, editar y borrar ya tenían su mensaje en cada panel. Lo que faltaba:
  - **"Quitar" una línea de receta** no tenía manejo de errores; ahora lo dice y el botón se desactiva mientras quita;
  - **la receta de un plato** podía no cargar sin aviso; ahora avisa;
  - **las categorías** se podían crear dos veces con doble clic, y **"Eliminar" plato** también se podía repetir; ahora los botones se desactivan mientras guardan;
  - **receta con insumo nuevo:** si se creaba el insumo pero fallaba la línea, al reintentar se creaba un insumo repetido; ahora se reutiliza el que ya tiene ese nombre.
  - Los formularios no se cierran ni se borran cuando algo falla, y los mensajes pasan por el traductor (un plato con pedidos dice "No se puede: está en uso…").

### 8. Login y registro ✅
- `src/views/modules/login/LoginPage.tsx`: después de iniciar sesión, la lectura del rol (`auth.getUser` y luego `usuarios`) no tiene manejo de errores.
- `src/views/modules/registro/RegistroPage.tsx`: si la red se cae en medio del registro, el botón puede quedar trabado en "Creando…".
- **✅ Hecho, login:** si falla leer el perfil después de entrar, se explica en la misma pantalla en vez de mandar a "/" (que rebotaba al login sin decir nada). Una cuenta sin perfil dice que hay que pedir acceso. Los errores de Supabase Auth salen traducidos ("Correo o contraseña incorrectos").
- **✅ Hecho, registro:**
  - a los 30 s sin respuesta se libera el botón;
  - sin respuesta o con la red caída, avisa que **la cuenta pudo haberse creado** y que conviene probar iniciar sesión antes de registrarse otra vez;
  - **bug arreglado:** los mensajes de la función (por ejemplo "Ya existe una cuenta con ese correo") nunca llegaban a la pantalla, porque supabase-js no los pone en `data` cuando la respuesta es un error. Ahora se leen del cuerpo.
- **✅ Ambos:** sin internet, los botones se desactivan con el aviso "Sin conexión: … necesita internet".

### 9. Mensajes técnicos crudos ✅
- **Problema:** varias pantallas muestran el error tal cual llega de Supabase, por ejemplo *"duplicate key value violates unique constraint"* o *"new row violates row-level security policy"*.
- **Arreglo propuesto:** una función común que traduzca los errores conocidos a frases para el usuario, y un mensaje genérico para el resto.
- **✅ Hecho.** Función en `src/lib/errores.ts` (`mensajeDeError`, con pruebas). Deja pasar los mensajes de nuestras reglas, que ya están en español, y traduce los técnicos: clave repetida, permisos, red, sesión vencida… Ya la usan todos los avisos nuevos. Ya se usa en **todas** las pantallas: administración, gerencia, sugerencias de la IA, reporte por día, cierre de cuenta, autopedido y login. Ninguna muestra `error.message` directo.

### 10. Sin aviso de "sin conexión" en administración y gerencia ✅
- **Problema:** esos módulos no funcionan offline, a propósito, pero sin red cada pantalla falla por su lado con un "Failed to fetch".
- **Arreglo propuesto:** un aviso general, por ejemplo "Sin conexión: esta sección necesita internet".
- **✅ Hecho** (`AvisoSinConexion.tsx`, `useEnLinea`):
  - en administración, gerencia y super-admin, sin red aparece una franja roja arriba: "Sin conexión: esta sección necesita internet…";
  - al volver la red, cambia a una franja verde, "Volvió la conexión", con **Actualizar datos**. No recarga sola, para no perder un formulario a medio llenar.

---

## Para el piloto, aunque no es manejo de errores

### 11. Pantallas de administración con datos de mentira — lo hace César

**Decisión de Pedro (2026-11-04):** no se toca en este módulo. César está quitando todos los datos de prueba de la app, y no tiene sentido agregar más para después borrarlos.

Todavía usan datos de ejemplo (`src/controllers/administracion/mockData`):
- ~~**Panel de inicio** de administración~~ y ~~**Pedidos**~~: **ya tienen datos reales**; los conectó César (`d645c06`, 2026-11-03).
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
