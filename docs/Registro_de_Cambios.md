# Registro de cambios

Seguimiento de lo que se cambia en el proyecto, más reciente primero. Cada entrada dice qué se hizo, para qué, qué decisiones se tomaron y qué queda pendiente. Complementa a `Roadmap_Construccion_MVP.md` (qué falta construir) con el detalle de qué se construyó y cómo.

---

## 2026-10-28 — Platos sugeridos para preparar hoy (Fase 6, Módulo 3)

Rama: `feature/fase6-platos-preparar` (sale de `feature/fase6-sugerencias-compra`). Autor: Pedro (con Claude Code). Migración `0022_platos_a_preparar.sql` **pendiente de aplicar en Supabase** (SQL Editor). La Edge Function `ia-sugerir-platos` **ya está desplegada**.

### Decisiones (Pedro, 2026-10-26)

- Los genera y aprueba **gerencia**, por sede, porque usan rentabilidad. **Cocina ve la lista aprobada, sin precios.**
- Aprobar **no cambia el menú ni el inventario**: solo publica la lista para cocina.
- La IA tiene en cuenta:
  - el stock, en porciones que alcanzan;
  - la rentabilidad;
  - lo que se vende ese día de la semana;
  - los insumos por vencer.
- Se generan **a mano, para el día**, con una pendiente a la vez por sede.

### Qué cambió

**Base de datos (migración `0022`):**
- **Política restrictiva en `sugerencias_ia`:** solo administración, gerencia y super-admin la leen o escriben. Antes la leía cualquiera del restaurante, y el contenido trae costos y márgenes. Esto también **cierra el pendiente de `0021`**: un mesonero ya no puede insertar sugerencias.
- **`validar_sugerencia_ia` actualizada:** las de platos solo las revisa gerencia; las de compra siguen siendo de administración.
- **`datos_platos_preparar(sede)`** calcula, por plato con receta disponible en la sede:
  - **porciones que alcanzan** con el stock (el mínimo entre los insumos, sin contar los "estimado") y el insumo que pone el límite;
  - **ventas esperadas**: promedio de ese día de la semana en las 4 semanas anteriores;
  - precio de la sede, costo y margen, con las compras de la sede (sin asumir nunca costo 0);
  - **insumos con lotes que vencen en 3 días**.
  - Como trae costos, a los roles que no son de gestión les devuelve una lista vacía.
- **`aprobar_sugerencia_platos(id, items)`:** solo gerencia, porciones enteras de 1 o más. Guarda la lista aprobada con el nombre y el motivo de cada plato.
- **`platos_sugeridos_hoy()`:** lo que ve cocina. Devuelve la última lista aprobada hoy para su sede, **solo plato, porciones y motivo**. Es `security definer` porque cocina ya no puede leer `sugerencias_ia`.

**Edge Function `ia-sugerir-platos`** (solo gerencia, recibe la sede):
- Verifica que la sede sea del restaurante y que no haya otra pendiente.
- Le ofrece a la IA los platos que se pueden preparar.
- Valida la respuesta con `_shared/platos.ts`:
  - máximo 8 platos;
  - se descartan los inventados o repetidos;
  - las porciones se recortan: **nunca más de las que alcanzan, ni más del doble de lo que se vende ese día** (mínimo 10).
- La lista **"sin stock"** (platos que se suelen pedir ese día pero hoy no alcanzan) la calcula el servidor, no la IA.
- `platos.test.ts`: 9 pruebas.

**Frontend:**
- **Gerencia → Sugerencias IA:** sección "Platos a preparar hoy" para la sede del selector (con una sola sede, se usa esa):
  - generar;
  - revisar cada plato: porciones, datos (ventas del día, cuánto alcanza, margen, qué vence) y motivo. Se pueden quitar platos y cambiar porciones;
  - aviso de platos sin stock;
  - aprobar o rechazar;
  - "En cocina hoy", con la lista aprobada;
  - historial.
- La prueba de conexión pasó al final de la página.
- **Cocina → pestaña "Sugeridos"** (entre Pedidos y Entregados), con un contador que muestra cuántos platos tiene la lista del día. La página muestra plato, porciones y motivo, sin precios. A pedido de Pedro va en su propia pestaña y no encima del tablero, para no estorbar.
  - Es lo único de cocina que usa red: se pide al entrar, cada 5 minutos y al volver la conexión.
  - Sin internet se queda con la última lista, y si nunca llegó ninguna no se muestra. El tablero sigue funcionando offline como antes.

**Verificado** en la copia local de la base, con todas las migraciones y los datos demo:
- Los números por plato salen bien: porciones e insumo limitante, ventas esperadas, margen, y un lote que vence en 2 días.
- Supervisor y cocina reciben la lista de datos vacía.
- Cocina y mesonero no leen ni insertan en `sugerencias_ia`.
- Administración no puede aprobar platos.
- Porciones no enteras: error.
- Cocina ve solo plato, porciones y motivo; un usuario de otra sede no ve nada.
- Administración sigue viendo sus sugerencias de compra.

Además, 28 pruebas de Node, `deno check`, `tsc -b` y `npm run build` pasan.

### Pasos para probarlo

1. Aplicar `supabase/migrations/0022_platos_a_preparar.sql` en el SQL Editor.
2. Entrar como gerencia, ir a **Sugerencias IA** y elegir la sede en el selector. La sede original tiene ventas demo, aunque su inventario no se descuenta con ellas. La **Sede Norte** tiene ventas e inventario. Tocar **Generar para hoy**, revisar y aprobar.
3. Entrar como cocina (`cocina@prueba.com`, que es de la sede original) y ver la pestaña **Sugeridos** con su contador. Para verla hay que haber aprobado una lista **para la sede de cocina**.

### Pendiente

- [ ] Pasos 1 a 3.
- [ ] Con eso verificado, marcar el Módulo 3 con ✅.

---

## 2026-10-26 — Sugerencias de compra con la IA y su aprobación (Fase 6, Módulos 2 y 5)

Rama: `feature/fase6-sugerencias-compra` (sale de `feature/fase6-ia-adaptador`). Autor: Pedro (con Claude Code). Migración `0021_sugerencias_compra.sql` **aplicada en Supabase por Pedro (2026-10-26)**. La Edge Function `ia-sugerir-compras` está desplegada.

### Decisiones (Pedro, 2026-10-26)

- Las sugerencias de compra las revisa y aprueba **administración**.
- **Al aprobar se crea un borrador de orden por proveedor**, marcado como sugerido por la IA (`creada_por` nulo). Se edita y se aprueba con el paso normal de Compras. La IA nunca crea una orden aprobada.
- **Cálculo mixto:** los números los pone la base y la IA solo ajusta y explica.
- Se generan **a mano**, para **7 días**.

### Qué cambió

**Base de datos (migración `0021`):**
- `sugerencias_ia.revisada_en`: cuándo se revisó cada sugerencia.
- `datos_sugerencia_compra(sede, dias)` calcula, por insumo "exacto" o "por lote" de la sede:
  - consumo diario (salidas y mermas de 28 días);
  - stock y mínimo;
  - lo ya pedido y sin llegar (borradores y aprobadas), para no pedirlo dos veces;
  - la cantidad base = consumo × días + mínimo − stock − lo pedido;
  - los días que alcanza el stock;
  - el proveedor y el costo de la última compra.
- Trigger `validar_sugerencia_ia`, porque RLS deja escribir en `sugerencias_ia` a cualquiera del restaurante:
  - toda sugerencia nace "pendiente";
  - se revisa una sola vez, y el servidor anota quién y cuándo;
  - las de compra solo las revisa administración;
  - una sugerencia revisada no cambia, y ninguna se borra.
- `aprobar_sugerencia_compra(id, items)`: valida rol, sede, cantidades y proveedores. Crea un borrador por proveedor y marca la sugerencia como aprobada, todo en una sola transacción.
- `rechazar_sugerencia_ia(id, motivo)`: exige motivo. Sirve también para los Módulos 3 y 4.

**Edge Function `ia-sugerir-compras`** (solo administración):
- Lee los números de su sede.
- Le pasa a la IA solo los insumos que hay que reponer, con referencias cortas y solo cifras (sin ids, proveedores ni personas).
- Valida la respuesta con `_shared/compras.ts`:
  - se descartan insumos inventados o repetidos;
  - cada cantidad se recorta entre 0 y 1,5 veces la base, y se redondea como en la base;
  - un insumo que la IA no revisó queda con la cantidad calculada.
- Guarda la sugerencia como pendiente. No crea órdenes.
- `compras.test.ts`: 8 pruebas de esa validación.

**Frontend:** pestaña **Sugerencias IA** en Inventario de administración (`/administracion/sugerencias-compra`):
- Botón "Generar sugerencias (7 días)".
- Bandeja de revisión: por cada insumo se ve stock, consumo, días que alcanza, cantidad calculada y motivo de la IA. Se puede quitar el insumo, cambiar la cantidad o el proveedor, y elegir proveedor para los que nunca se compraron.
- "Aprobar y crear borradores", o "Rechazar" con motivo.
- Historial de las revisadas.
- Los borradores aparecen en Compras como "IA (sugerida)".

**Datos demo:** `supabase/seeds/demo_compras_sede_norte.sql` baja el stock de 8 insumos de la Sede Norte (que es toda inventada) para que haya algo que sugerir. Explica cómo pasar al usuario de administración a esa sede para probar, y cómo devolverlo.

**Verificado** sobre una copia local de la base, con todas las migraciones y los datos demo:
- Una sugerencia no se puede colar como aprobada.
- Mesonero y gerencia no pueden aprobar.
- No se aprueba vacía, con cantidad 0 o sin proveedor.
- Al aprobar se crean 2 borradores (uno por proveedor), con `creada_por` nulo y sin aprobar.
- Lo pedido se descuenta de la siguiente sugerencia.
- Una sugerencia revisada no se puede cambiar, volver a aprobar ni borrar.
- Rechazar exige motivo.

Además: 19 pruebas de Node, `deno check`, `tsc -b` y `npm run build` pasan.

**Falta:** la prueba con Gemini real.

### Pasos para probarla

1. Aplicar `supabase/migrations/0021_sugerencias_compra.sql` en el SQL Editor.
2. Correr `supabase/seeds/demo_compras_sede_norte.sql` en el SQL Editor.
3. Pasar al usuario de administración de prueba a la Sede Norte. La instrucción SQL está al principio de ese mismo script. Después, cerrar sesión y volver a entrar.
4. Ir a Administración → Inventario → **Sugerencias IA** → **Generar sugerencias**, revisar y aprobar. Comprobar que los borradores aparecen en **Compras**.
5. Devolver al usuario de administración a su sede (también está en el script).

### Resultado de la prueba (2026-10-26)

- [x] Pasos 1 a 4. Pedro generó, aprobó una sugerencia y rechazó las demás. La aprobación creó 2 borradores "IA (sugerida)", uno por proveedor: Distribuidora Norte con 10 insumos ($122.04), y Distribuidora con 1 insumo sin precio de referencia ($0.00, porque nunca se había comprado).
- [x] Paso 5: el usuario de administración volvió a la Sede Principal.
- [x] Ciclo completo verificado en la base: generar, aprobar la sugerencia, aprobar la orden OC-E417AD02 en Compras y registrar la recepción. Los 11 insumos sumaron al stock la cantidad exacta pedida, cada uno con su movimiento de "entrada".
- **Problema a vigilar en el modo offline (para César):** durante la prueba, el navegador de Pedro se quedó con una **copia local de PowerSync trabada**. Después de cambiar de sede al usuario, la fila nueva nunca se aplicó en el navegador, aunque cerrara sesión y recargara con Ctrl + F5.
  - Se descartó todo lo del lado del servidor: el slot de replicación de PowerSync estaba activo y sin atraso, `usuarios` está en la publicación, PowerSync aceptó el token de sesión y su stream mandaba la versión nueva de la fila.
  - Se arregló borrando los datos del sitio (F12 → Application → Storage → Clear site data).
  - Si un mesonero o cocina ven datos viejos que no se actualizan, es lo mismo. Vale la pena investigar por qué se traba (¿varias pestañas abiertas?, ¿una actualización del esquema local?) y quizás ofrecer un botón de "reiniciar datos locales".
- Dos fallas encontradas en la prueba, ya arregladas (commit `d79339a`):
  - **La bandeja no mostraba nada.** La función genera para la sede que dice la base, pero la bandeja usaba la sede del perfil guardado en el navegador (PowerSync), que quedaba atrasado después de cambiar al usuario de sede. Ahora la bandeja usa la sede del servidor, la muestra y avisa si el navegador tiene otra.
  - **Cada clic creaba una sugerencia nueva igual.** Ahora solo puede haber una pendiente por sede, y eso se controla en la pantalla y en la función.
- [x] Módulo 2 marcado con ✅. El Módulo 5 se cierra cuando los Módulos 3 y 4 también usen la bandeja.
- Límite conocido: cualquier usuario del restaurante puede **insertar** una sugerencia directamente por la API (RLS lo permite), aunque siempre entra como "pendiente" y solo administración la puede aprobar. Cerrarlo pide una política de inserción por rol.

---

## 2026-10-26 — Capa adaptadora de IA (Fase 6, Módulo 1)

Rama: `feature/fase6-ia-adaptador`. Autor: Pedro (con Claude Code). **No tiene migraciones.**

### Decisiones (Pedro, 2026-10-26), también en `arquitectura.md` §4.5

- La IA corre en **Edge Functions de Supabase**. La clave nunca llega al navegador.
- Al modelo se le mandan **solo resúmenes con cifras, sin nombres** de personas ni datos de clientes. El nivel gratuito de Gemini puede usar lo que recibe.
- La **aprobación de sugerencias** se construye junto con el Módulo 2, no al final.
- Pedro crea la clave de Gemini.

### Qué cambió

**Capa de IA** (`supabase/functions/_shared/ia/`):
- `proveedor.ts`: la interfaz común `ProveedorIA.generarJSON(instrucciones, mensaje, esquema)`, que pide siempre un JSON con forma fija. También define `ErrorIA`, con códigos propios y mensajes en español (`no_configurada`, `clave_invalida`, `modelo_no_encontrado`, `cuota_agotada`, `bloqueada`, `respuesta_invalida`, `sin_conexion`).
- `gemini.ts`: el adaptador de Gemini por su API REST.
  - La clave va en un encabezado, no en la URL.
  - El esquema se traduce al formato de Gemini.
  - Espera como máximo 30 segundos.
  - Traduce cada error de Gemini a un código propio.
- `index.ts`: `obtenerProveedorIA(config)` elige el adaptador según el secreto `IA_PROVEEDOR`, que por defecto es `gemini`. Cambiar de proveedor es escribir otro adaptador y agregar un `case`.
- `ia.test.ts`: 11 pruebas con un Gemini falso, sin red ni clave. Se corren con `node --test supabase/functions/_shared/ia/ia.test.ts`.

**Edge Functions:**
- `_shared/http.ts`: CORS, respuestas en JSON y `autenticar(req, roles)`. Identifica a quien llama con su propia sesión, verifica su rol y devuelve un cliente que pasa por RLS. **No se usa la clave de servicio.**
- `ia-probar`: hace una pregunta mínima al modelo y devuelve proveedor, modelo y tiempo de respuesta. No envía datos del restaurante ni guarda nada. Solo para gerencia y administración.

**Frontend:** página **Sugerencias IA** (`/gerencia/sugerencias`), con el botón "Probar conexión". Aquí van a llegar las sugerencias de los Módulos 2 a 4.

**Verificado:**
- Las pruebas del adaptador pasan (11 al cierre del módulo).
- `deno check` de la función, sin errores.
- La función se levantó localmente con Deno: la consulta previa de CORS (OPTIONS) responde 200, y las llamadas sin sesión o con una sesión inválida reciben 401.
- `tsc -b` y `npm run build` pasan.

**Falta:** la prueba real contra Gemini, que necesita la clave.

### Pasos para activarla

1. **Crear la clave de Gemini (gratis, sin tarjeta):** entra a https://aistudio.google.com con una cuenta de Google, ve a **Get API key**, luego **Create API key**, y cópiala. No la pegues en el chat ni en el código.
2. **Guardarla en Supabase:** en el panel de Supabase, ve a **Edge Functions**, luego **Secrets**, y agrega `GEMINI_API_KEY` con la clave. Es opcional agregar también `GEMINI_MODELO`. Si no se pone, se usa `gemini-flash-lite-latest`. Si un modelo no existe o no responde a tiempo, la prueba lo dice, lista los modelos que la clave sí puede usar, y se cambia este secreto.
3. **Desplegar la función** desde la carpeta del proyecto:
   ```bash
   npx supabase login
   npx supabase functions deploy ia-probar --use-api
   ```
   `--use-api` evita necesitar Docker. El proyecto ya está vinculado (`supabase/.temp/project-ref`).
4. **Probar:** entra como gerente, ve a **Sugerencias IA** y toca **Probar conexión**. Tiene que salir "Conectada: gemini · … respondió en X s".

### Resultado de la puesta en marcha (2026-10-26)

- [x] Pedro creó la clave y la guardó como secreto. La función `ia-probar` quedó desplegada y la prueba conecta: **`gemini-flash-lite-latest` respondió en 0,6 s**.
- Lo que se aprendió con la clave nueva:
  - `gemini-2.5-flash-lite` y `gemini-2.5-flash` devuelven "no encontrado", aunque aparecen en la lista de modelos.
  - `gemini-flash-latest` no respondió en 60 s.
  - El alias **`gemini-flash-lite-latest`** funciona. Por eso quedó como predeterminado del código y como valor del secreto `GEMINI_MODELO`.
- Mejoras que salieron de esa prueba:
  - El error del modelo muestra el motivo exacto que da Gemini.
  - Se distingue "no respondió a tiempo" (`tiempo_agotado`) de "no se pudo conectar". La espera máxima subió a 60 s.
  - Cuando el modelo falla, la prueba lista los modelos que la clave sí puede usar.
  - Ahora son 11 pruebas.
- [x] Módulo 1 marcado con ✅ en el Roadmap.

---

## 2026-10-22 — Alertas y excepciones para gerencia (Fase 5, Módulo 4)

Rama: `feature/fase5-alertas` (sale de `feature/fase5-multi-sede`). Autor: Pedro (con Claude Code). Migración `0020_alertas_gerencia.sql` **aplicada en Supabase por Pedro (2026-10-22)**.

### Decisiones (Pedro, 2026-10-22)

Seis alertas, umbrales fijos, solo para gerencia, y solo se muestran (no hay "marcar como revisada"). El detalle y los umbrales están en el Roadmap, Fase 5, Módulo 4:

- merma alta
- anulación de platos ya preparados
- faltante en conteo físico
- plato con margen negativo
- ventas caídas
- stock bajo mínimo

No entra "muchas anulaciones de una persona".

### Qué cambió

**Base de datos (migración `0020`):** `alertas_gerencia(p_sede_id)`.
- Calcula las seis alertas al momento y devuelve tipo, gravedad, sede, fecha y los datos que dispararon cada una.
- Solo responde a gerencia: el rol se verifica dentro de la función.
- Es `security invoker`, así que RLS sigue separando restaurantes.
- Los días se cuentan en la zona horaria de cada sede.
- Costo de los insumos: la última compra de la sede o, si nunca se compró ahí, la de cualquier sede. Un insumo nunca comprado no suma a la merma en $.
- El faltante del conteo físico sale de la referencia que guarda `useConteoFisico` ("teórico X, contado Y").
- Gravedad "alta": plato con margen negativo, insumo agotado, y merma que cumple los dos criterios a la vez. Las demás son "media".

**Frontend:**
- Página **Alertas** (`/gerencia/alertas`): cada alerta con su gravedad, explicada en una frase, y un enlace a donde se ve el detalle (Inventario, Rentabilidad o el Reporte por día de esa fecha). Incluye un resumen por tipo y la explicación de cómo se calcula cada una.
- La página respeta el selector de sede. No usa el de período, porque cada alerta tiene su propia ventana fija.
- **Contador rojo** junto a "Alertas" en la barra lateral, visible desde cualquier sección. La barra lateral compartida (`PanelSidebar`) acepta ahora un `contador` opcional.
- El Reporte por día acepta `?dia=YYYY-MM-DD` para abrir directamente una fecha.

**Prueba sobre una copia local de la base**, con todas las migraciones y los datos demo:
- Las seis alertas se disparan con su caso.
- Los casos por debajo del umbral no se disparan: un conteo de 1%, un insumo con stock suficiente y una merma normal.
- Una merma que triplica el promedio sale como "alta".
- El supervisor recibe el error "Solo gerencia puede ver las alertas".

### Pendiente

- [x] Aplicar `0020_alertas_gerencia.sql` en el SQL Editor.
- [x] Probar en la app con el usuario de gerencia, con los datos demo de las dos sedes cargados.
- [x] Con eso verificado, marcar el Módulo 4 con ✅ en el Roadmap (Pedro lo probó, 2026-10-22).
- Observación de la prueba: la regla "más de 50% sobre el promedio" también salta con montos chicos. Con los datos demo, la Sede Norte da alerta por $12.64 de merma frente a un promedio de $3.85. Queda como está, porque así se decidió, pero un monto mínimo semanal ayudaría.

---

## 2026-10-22 — Vista multi-sede para gerencia (Fase 5, Módulo 3)

Rama: `feature/fase5-multi-sede`. Autor: Pedro (con Claude Code). Migración `0019_kpis_sedes.sql` **aplicada en Supabase por Pedro (2026-10-22)**.

### Decisiones (Pedro, 2026-10-22)

- **Selector de sede** en todo el panel de gerencia: "Todas las sedes" (consolidado) o una en particular.
- **Página "Sedes"** para comparar las sedes entre sí.
- **Costo de los insumos:** con una sede elegida, la última compra recibida **en esa sede**. En "Todas", la más reciente de **cualquier** sede. El servidor ya lo calculaba así desde `0012`; ahora la ficha de receta y la lista de "falta registrar una compra" también lo respetan.
- No había datos de una segunda sede: se crean datos demo para probar.

### Qué cambió

**Base de datos (migración `0019`):**
- `kpis_sedes(p_desde, p_hasta)`: una fila por sede con ventas, propinas, cuentas, ticket promedio, platos e importe anulados, valor de la merma y valor del inventario de hoy (cada sede con el costo de sus propias compras). Los insumos con stock que nunca se compraron en esa sede no se valorizan y se cuentan aparte (nunca costo 0). `security invoker`, como el resto de los KPIs.
- `kpis_ventas`, `kpis_inventario`, `kpis_rentabilidad` y `reporte_diario` no cambian: ya aceptaban `p_sede_id`.

**Frontend:**
- `useKpisVentas` guarda la sede elegida junto al período y la pasa a todas las consultas. La lista de sedes sale de la tabla `sedes` (RLS: solo las del restaurante).
- `SelectorSede` en el encabezado de Ventas, Rentabilidad, Inventario y Reporte por día. Con una sola sede no se muestra.
- Página **Sedes** (`/gerencia/sedes`): barras con la parte de las ventas de cada sede y tabla comparativa. El margen bruto por sede usa `kpis_rentabilidad` de cada sede, igual que la página de Rentabilidad.
- La ficha de receta de Rentabilidad usa los costos de la sede elegida.

**Datos demo (`supabase/seeds/`, no son migraciones):**
- `demo_segunda_sede.sql` (requiere `demo_recetas.sql` antes): crea "Demo · Sede Norte" con 10 mesas y 30 días de ventas en **las dos sedes**, con pagos, propinas y algunas anulaciones. En la Sede Norte también su inventario: dos compras algo más caras que las de la sede original, las salidas por receta, las mermas y el stock final. En la sede original las ventas demo no tocan el inventario. Sin usuarios nuevos: las mesas de la Sede Norte quedan "Sin mesonero".
- `demo_segunda_sede_borrar.sql`: deshace todo lo anterior.
- Probado sobre una copia local de la base (todas las migraciones aplicadas): las ventas consolidadas son la suma de las dos sedes, un mismo plato cuesta distinto según la sede, el borrado deja la base exactamente como estaba, y el supervisor sigue limitado a su sede y a hoy.

### Pendiente

- [x] Aplicar `0019_kpis_sedes.sql` en el SQL Editor.
- [x] Correr `supabase/seeds/demo_segunda_sede.sql` en el SQL Editor.
- [x] Probar en la app con el usuario de gerencia: selector de sede en cada sección y página Sedes.
- [x] Con eso verificado, marcar el Módulo 3 con ✅ en el Roadmap (Pedro lo probó, 2026-10-22).

---

## 2026-10-22 — Reporte por día para supervisor y gerencia (Fase 5, Módulo 2)

Rama: `feature/fase5-reporte-diario`. Autor: Pedro (con Claude Code). Migración `0018_reporte_diario.sql` **aplicada en Supabase por Pedro (2026-10-22)**.

### Por qué

El supervisor no podía ver ningún reporte, aunque §4.10 le daba los "reportes del turno". Además no estaba definido qué era un turno.

### Decisiones (Pedro, 2026-10-22)

- **No hay turnos: el reporte es por día** calendario de la sede, en su zona horaria. No se crea tabla de turnos.
- **Supervisor:** solo el día de **hoy** y solo **su sede**. Ventas, propinas, medios de pago, ventas por mesonero, cada cobro y las anulaciones. **Sin costos ni rentabilidad.**
- **Gerencia:** cualquier día pasado y el **historial día por día**, de todas las sedes de su restaurante.
- **Administración:** no ve estos reportes.
- **Las anulaciones van en el reporte:** hora, mesa, plato, importe, motivo, quién anuló y si dejó merma.

### Qué cambió

**Base de datos (migración `0018`):**
- `reporte_diario(p_dia, p_sede_id)`: el reporte de un día. Verifica el rol en el servidor: solo `supervisor` y `gerencia`. Al supervisor siempre le da su propia sede y rechaza cualquier día que no sea hoy. Hace falta porque la RLS de `pagos_cierre` deja leer a cualquier usuario de la sede.
- `reporte_diario_historial(p_desde, p_hasta, p_sede_id)`: totales por día, también los días sin ventas. Solo gerencia.
- Mismo criterio que `kpis_ventas`: venta = cuenta cerrada con pago. Una mesa liberada por anulación total (`0016`) no cuenta como venta. Ambas son `security invoker`, así que RLS sigue separando restaurantes y sedes.

**Frontend:**
- Supervisor: pestaña **"Reporte del día"** en su barra (`/mesoneros/reporte`), con botón "Actualizar". Solo aparece para supervisor y gerencia. Necesita internet; sin conexión lo avisa y el resto del módulo sigue funcionando offline.
- Gerencia: **"Reporte por día"** en la barra lateral (`/gerencia/reportes`), con selector de día (anterior/siguiente/fecha) e historial de 7, 30 o 90 días. Tocar un día del historial abre su reporte.
- `ReporteDiarioVista` (en `src/views/components/reportes/`) es el contenido compartido por las dos pantallas.
- `ETIQUETA_METODO_PAGO` pasa a `components/ui/constants.ts` para no duplicarla.

### Pendiente

- [x] Aplicar `0018_reporte_diario.sql` en el SQL Editor.
- [x] Probar con `supervisor@prueba.com` (debe ver solo hoy) y con un usuario de gerencia (días pasados e historial). Verificar que un mesonero recibe error si llama a `reporte_diario`.
- [x] Con eso verificado, marcar el Módulo 2 con ✅ en el Roadmap (Pedro lo probó, 2026-10-22).
- Límite conocido (no se cambia aquí): la RLS de `pagos_cierre` sigue dejando que un mesonero o cocina lean los pagos crudos de su sede por la API. La pantalla y la función están protegidas, pero las tablas no. Cerrarlo pide revisar la política sin romper el cierre de cuenta.

---

## 2026-10-16 — Supervisor de sala: anular platos y transferir mesas (Fase 2, Módulo 7)

Rama: `feature/navegacion-mesonero`. Autor: Pedro (con Claude Code). Migración `0015_supervisor_anular_transferir.sql` **aplicada en Supabase por Pedro (2026-10-16)**.

### Por qué

Hasta ahora el rol `supervisor` era un mesonero con otro nombre: ninguna de sus capacidades de §4.10 estaba construida.

### Decisiones (Pedro, 2026-10-16)

- **Se construyen** anular un plato y transferir una mesa.
- **Descuentos menores: fuera por ahora.**
- **Reportes del turno:** se hacen con la Fase 5, Módulo 2, ya con acceso para el supervisor.
- **Anular:**
  - Se puede en espera, en preparación o listo. Nunca entregado: eso sería una devolución o un descuento.
  - El motivo es obligatorio.
  - Si el plato ya se estaba preparando o estaba listo, sus ingredientes se registran como **merma**. Si estaba en espera, no se descuenta nada.
  - Cocina lo ve **tachado en su ticket** hasta que toca "Entendido".
- Gerencia también puede anular y transferir, porque §4.10 le da "todo lo anterior".

### Qué cambió

**Base de datos (migración `0015`):**
- `pedidos_items` acepta el estado `anulado`, con nuevas columnas: `anulado_por`, `anulado_en`, `motivo_anulacion`, `anulado_desde` y `anulacion_vista_en`.
- **Triggers que hacen cumplir las reglas,** aunque el cambio llegue desde la cola offline de PowerSync. RLS deja a cualquiera de la sede escribir esas tablas, así que la barrera real tiene que estar en la base:
  - Solo `supervisor` o `gerencia` puede anular o transferir.
  - No se puede anular lo entregado, ni hacerlo sin motivo, ni "des-anular".
  - Quién anuló y desde qué estado los pone el servidor.
  - Tomar una mesa sin mesonero (QR) sigue siendo de cualquiera. Cambiarle el mesonero a una mesa que ya tiene uno es transferirla, y solo puede hacerlo el supervisor.
- **Merma por anulación:** la lógica de descontar una receta (lotes, insumos estimados) se extrajo de `descontar_inventario_por_entrega` (0008) a `descontar_receta_de_item`. La usan la entrega (`salida`, igual que antes) y la anulación (`merma`).
- **`kpis_ventas`, `kpis_rentabilidad` y `pedido_publico_mesa`** excluyen lo anulado. Son copias exactas de 0010, 0012 y 0006 con ese único cambio.

**Sincronización (`powerSyncClient.ts`):**
- Las columnas nuevas se agregaron al esquema local.
- **El conector descarta los cambios que la base rechaza por regla de negocio** (errcode `P0001`), en vez de reintentarlos para siempre. Antes, un rechazo así trababa la cola de subida del dispositivo y nada más subía. Ejemplo: el supervisor anula sin conexión un plato que cocina entregó mientras tanto. El cambio descartado se corrige solo con la siguiente sincronización.

**Mesonero (solo con rol supervisor o gerencia):**
- En el pedido de una mesa, cada plato enviado y no entregado tiene un botón **Anular**. Abre un modal con motivos rápidos o texto libre, y avisa si habrá merma.
- En el mapa:
  - Las mesas de otro mesonero ofrecen **Ver pedido (anular platos)** y **Transferir mesa**.
  - Las mesas propias también ofrecen **Transferir mesa**.
  - El modal de transferencia lista los mesoneros y supervisores de la sede.
- Lo anulado se ve tachado para todos: en el pedido, en Mis pedidos y en el cierre de cuenta.
- **El cierre de cuenta no cobra lo anulado** y no espera a que cocina lo termine.
- La barra superior muestra el rol real (Mesonero, Supervisor o Gerencia), en vez de "Mesonero" fijo.

**Cocina:**
- El plato anulado aparece tachado con **ANULADO** y el motivo, en el ticket del estado en que estaba.
- **"Entendido, quitar anulados"** lo saca del tablero.
- Si el ticket quedó todo anulado, no ofrece avanzar de estado.
- Lo anulado no cuenta en el "Resumen global".

### Para dejarlo funcionando

1. ~~Aplicar `supabase/migrations/0015_supervisor_anular_transferir.sql` en Supabase.~~ Hecho (2026-10-16).
2. **Sync Rules de PowerSync:** si la regla de `pedidos_items` lista columnas en vez de `select *`, hay que agregar las cinco nuevas. Si no, no llegan a los dispositivos y cocina no verá el motivo ni sabrá en qué ticket va lo anulado.

## 2026-10-16 — Navegación de cocina: barra superior, entregados, recetas y alertas de demora

Rama: `feature/navegacion-mesonero` (sigue a la navegación del mesonero). Autor: Pedro (con Claude Code).

### Decisiones (Pedro, 2026-10-16)

- **La barra de cocina es ligera.** El tablero sigue siendo la pantalla principal (§4.2, "una pantalla general"). Tiene tres secciones:
  - **Pedidos**: el tablero.
  - **Entregados del turno**.
  - **Recetas**.
- **Agotados queda fuera por ahora.** Que cocina marque un plato agotado sería una decisión nueva: hoy eso solo lo hace administración y necesita internet.
- **A la derecha de la barra:** estado de conexión, reloj y usuario con "Cerrar sesión".
- **Alertas de demora con umbral fijo:** ámbar a los 10 min y rojo a los 20.

### Qué cambió

- **Rutas anidadas** bajo `CocinaLayout`: `/cocina` (tablero), `/cocina/entregados` y `/cocina/recetas`.
- **Piezas compartidas con el mesonero** (`src/views/components/layout/`):
  - `BarraSuperior`: pestañas con contador.
  - `MenuUsuario`: nombre y "Cerrar sesión".
  - `IndicadorConexion`: lee `powerSync.currentStatus` con `useEstadoConexion`. Muestra "En línea", "Sincronizando…" o "Sin conexión".
  - `BarraMesonero` ahora usa las dos primeras.
- **`useAhora`**: un reloj que se refresca solo. Los minutos de cada ticket y las alertas avanzan sin que nadie toque la pantalla; antes solo cambiaban si algo se volvía a dibujar.
- **Tablero:**
  - Un ticket en espera o en preparación se pinta ámbar desde los 10 min y rojo desde los 20, contando desde el plato más antiguo.
  - Los "listos" no se marcan, porque ya salieron de los fogones.
  - La pestaña Pedidos cuenta los tickets en espera.
- **Entregados hoy** (`useEntregados`):
  - Lo que salió de cocina hoy, por mesa, con buscador.
  - La hora que se muestra es la del pedido, porque `pedidos_items` no guarda cuándo se entregó.
  - Es solo consulta.
- **Recetas:**
  - Todos los platos del menú con buscador y filtro por categoría. Avisa los que no tienen receta.
  - Al tocar uno se abre la misma `RecetaModal` del tablero.
  - Sin precios, porque cocina no los ve (§4.10).
- **Bug corregido:** `useCocina` guardaba el ticket "actualizando" con una clave distinta a la que compara el tablero. Por eso el botón nunca se desactivaba ni mostraba "Actualizando…", y se podía tocar dos veces.

### Pendiente

- **Agotados desde cocina:** falta decidir si se permite y cómo funcionaría sin internet.
- **Entregados del turno depende de las Sync Rules de PowerSync.** Si no bajan al dispositivo los ítems entregados de mesas ya cerradas, solo se verán los de mesas abiertas.

## 2026-10-16 — Navegación del mesonero: barra superior, menú primero y borradores por mesa

Rama: `feature/navegacion-mesonero`. Autor: Pedro (con Claude Code).

### Por qué

Pedro pidió que la navegación de la app sea completamente funcional, empezando por el mesonero. Había tres problemas:
- El carrito vivía dentro de la página de pedido: salir sin enviar lo borraba.
- No había forma de cerrar sesión (el único botón estaba en la página de inicio, que ya no existe).
- Solo se podía anotar después de abrir la mesa, y en la práctica el mesonero muchas veces anota primero.

### Decisiones (Pedro, 2026-10-16)

- **Los dos flujos conviven.** "Mesa primero" (mapa → mesa → tomar pedido) y "menú primero" (Menú → anotar → elegir la mesa al enviar). En ambos se puede cambiar la mesa **antes** de enviar. Después de enviar, no: cocina necesita saber a qué mesa va cada plato.
- **Barra superior** con Mesas · Menú · Mis pedidos, más el nombre del mesonero y "Cerrar sesión".

### Qué cambió

- **Rutas anidadas** bajo `MesoneroLayout` (`App.tsx`):
  - `/mesoneros`: mapa de mesas.
  - `/mesoneros/menu`: menú sin mesa.
  - `/mesoneros/menu/:mesaId`: menú de una mesa. Reemplaza `/mesoneros/pedidos/:mesaId`.
  - `/mesoneros/pedidos`: Mis pedidos.
- **`BarraMesonero`**:
  - Menú muestra cuántos platos hay anotados sin enviar.
  - Mis pedidos muestra en verde cuántos platos están **listos para llevar**.
  - En el celular las pestañas quedan solo con ícono y contador.
- **Borradores por mesa** (`CarritoProvider`, `carritoContext.ts`, `useCarritos`):
  - Un borrador por mesa (más uno "sin mesa"), así ir de una mesa a otra no mezcla platos.
  - Viven en el layout y se guardan en `localStorage` (`carritos:<usuario.id>`), así que sobreviven a la navegación y a una recarga sin internet.
  - Son locales: cocina ve un plato recién cuando se envía.
- **"Cambiar mesa" / "Elegir mesa"** (`SelectorMesaModal`): solo ofrece mesas que aceptan pedido. Son las propias, las libres (se abren al enviar) y las pedidas por QR sin atender (pasan a ser del mesonero al enviar). Las de otro mesonero y las por limpiar no aparecen, igual que en el mapa.
- **Enviar a cocina** (`usePedidos.enviarACocina(mesa)`) resuelve la sesión antes de enviar con `abrirMesa` / `atenderMesa` (`sesionMesaService.ts`). Todo son escrituras locales PowerSync: funciona sin internet.
- **`useMesasSede`**: el cálculo del estado de cada mesa salió de `MapaMesas` para compartirlo con el selector.
- **Mis pedidos** (`MisPedidosPage`, `useMisPedidos`):
  - Muestra lo enviado en las mesas abiertas del mesonero, agrupado por mesa, con "Listo para llevar" primero.
  - Avisa de las mesas con platos sin enviar y de lo anotado sin mesa.
  - Es solo lectura: cobrar sigue siendo desde el mapa.
- Si la mesa de la URL pasó a otro mesonero o se cerró, el borrador no se pierde: se avisa y se ofrece moverlo.

### Pendiente

- ~~Cocina, Administración y Gerencia tampoco tienen "Cerrar sesión".~~ Resuelto el mismo día: cocina lo tiene en su barra superior, y Administración y Gerencia al pie de su barra lateral (`PanelSidebar`).
- **`ProtectedRoute`** manda a `/` cuando el rol no corresponde, y eso termina en `/login` aunque haya sesión.
- **Cerrar sesión sin internet:** `supabase.auth.signOut()` necesita conexión para invalidar la sesión. Sin internet, la sesión puede quedar abierta en el dispositivo.

## 2026-10-15 — Panel propio de gerencia; gerencia deja de entrar a Administración

Rama: `feature/fase5-dashboard-kpis`. Autor: Pedro (con Claude Code).

### Por qué

Desde el dashboard, "Cargar receta →" y el botón "Administración →" daban **"Tu usuario no tiene una sede asignada."** El gerente tiene `sede_id` nulo (permitido para gerentes de cadena, `modelo-de-datos.md`), y todas las pantallas de Administración exigen una sede. Pedro decidió que el problema es de diseño: gerencia no debería entrar a Administración, sino tener su propio panel con barra lateral, como el de administración.

### Qué cambió

- **Panel de gerencia con barra lateral** (`GerenciaLayout.tsx`, rutas anidadas en `App.tsx`):
  - `/gerencia`: Ventas (tarjetas, por día, platos, horas, categorías, medios de pago, mesoneros).
  - `/gerencia/rentabilidad`: rentabilidad por plato.
  - `/gerencia/inventario`: rotación de inventario.
  - Reportes por turno, Sedes y Alertas (Fase 5, Módulos 2–4) llevan a `/proximamente`.
  - Un solo `useKpisVentas` vive en el layout y llega a las secciones por `useOutletContext` (`useKpisGerencia`). El período elegido se mantiene al cambiar de sección y no se vuelve a pedir todo.
  - El layout no pide sede.
- **Barra lateral compartida** `src/views/components/layout/PanelSidebar.tsx`. `AdminSidebar` y `GerenciaSidebar` solo definen sus enlaces.
- **Ficha de receta de solo lectura** (`FichaRecetaModal.tsx`, `fetchRecetaCosteada`): "Ver receta →" en los platos con receta muestra insumos, cantidades, costo de cada uno (última compra recibida de cualquier sede, igual que `kpis_rentabilidad` sin sede), costo total y margen. Los platos sin receta dicen "Administración debe cargar su receta".
- **Se quitó el botón "Administración →"** del dashboard y `gerencia` de `rolesPorModulo['/administracion']`.
- Gerencia sigue entrando a Mesoneros y Cocina (sin cambios).
- `arquitectura.md` §4.10 registra la decisión.

### Ojo

- **Es solo el acceso del frontend.** Las políticas RLS (`0002`) siguen dejando a `gerencia` leer y escribir inventario, compras, recetas, etc. de su tenant. Leer hace falta para la ficha de receta y los KPIs. Si se quiere que la base también le impida escribir, hace falta una migración aparte.
- Mesoneros y Cocina también exigen sede. Un gerente sin sede sigue sin poder usarlos.

## 2026-10-15 — Datos de demostración para el dashboard + pistas en "Rentabilidad por plato"

Rama: `feature/fase5-dashboard-kpis`. Autor: Pedro (con Claude Code).

### Por qué

Con el menú real cargado pero sin recetas (solo 1 de 46 platos tenía), casi todo salía "Sin receta" y no se podía ver la rentabilidad con datos realistas. Pedro propuso cargar insumos ficticios como migración. Se acordó hacerlo **como script de datos de demostración, no como migración**: `supabase/migrations/` es el historial del esquema y se aplicaría también en una base nueva o en producción, y el menú es el real del cliente piloto, así que las recetas inventadas tienen que poder distinguirse y borrarse.

### Qué se agregó

- **`supabase/seeds/demo_recetas.sql`** (se corre a mano en el SQL Editor, una vez; si ya están cargados no hace nada):
  - 32 insumos "Demo · …" con precios aproximados en dólares por unidad.
  - Un proveedor demo y una orden de compra **recibida**, con su entrada de inventario y su movimiento `entrada`, igual que si se recibiera desde Administración → Compras. Así el costo, el stock, la rotación y el valor en stock son coherentes.
  - Recetas para 41 platos, deducidas de la descripción de cada plato en el menú (las cantidades son inventadas). No pisa ninguna receta real ni toca platos, precios, ventas, el insumo "por lote" ni el plato "prueba".
  - Los tres estados quedan a la vista. **Costo incompleto:** Cheese miel, Queso spicy y Monster crispy usan un insumo demo que nunca se compró. **Sin receta:** Marquesa de chocolate, Pie, Mixto (Filadelfia) y Plato fit de pollo.
- **`supabase/seeds/demo_recetas_borrar.sql`**: borra todo lo que lleva "Demo · " (recetas, insumos con su inventario/lotes/movimientos, la orden y el proveedor demo) y deja la base como estaba.
- **Dashboard**:
  - Los platos "Sin receta" llevan un enlace **"Cargar receta →"** que abre ese plato en Administración → Menú (`?plato=<id>`, nuevo en `MenuAdmin.tsx`).
  - Los platos con "Costo incompleto" dicen **qué insumo falta comprar** (`fetchInsumosSinCompra`).

### Ojo

- Con recetas cargadas, cada plato que cocina marca como entregado descuenta estos insumos del stock (trigger de la `0008`). Para pruebas está bien.
- La base es compartida: César también va a ver los insumos y la compra demo en sus pantallas de inventario. Hay que avisarle antes de correr el script.
- `MenuAdmin.tsx` es de César: el cambio es solo leer `?plato=` para preseleccionar un plato.

### Pendiente

- [ ] Avisar a César y correr `demo_recetas.sql` en el SQL Editor.
- [ ] Verificar los costos de algunos platos contra la receta × precio demo.
- [ ] Cuando el restaurante cargue sus recetas reales, correr `demo_recetas_borrar.sql`.

---

## 2026-10-15 — Fase 5, Módulo 1 (rentabilidad por plato y valor del inventario)

Rama: `feature/fase5-dashboard-kpis`. Autor: Pedro (con Claude Code). Con esto el dashboard de gerencia cubre las tres métricas del Módulo 1: ventas, rotación y rentabilidad.

### Decisión de producto (confirmada por Pedro)

`insumos` no tiene costo (decisión de la Fase 4). **El costo de un insumo es el de su última compra recibida.** Con precios que cambian rápido es lo que cuesta hoy reponerlo; un promedio de compras viejas mostraría márgenes mejores de lo que son. Se descartaron el promedio de las últimas compras y el promedio de todo el historial.

### Cómo funciona

- Vista `costo_insumo_actual` (migración `0012`, `security_invoker`): por sede e insumo, `costo_estimado` del ítem de la orden **recibida** más reciente (`costo_estimado` es por unidad del insumo). Borradores y órdenes aprobadas no cuentan. Queda reutilizable para la Fase 6 (sugerencias de compra).
- Función `kpis_rentabilidad(desde, hasta, sede)`: por cada plato vendido en el período (mismas cuentas que `kpis_ventas`), precio real cobrado contra **costo = receta × costo de cada insumo**. Sin sede filtrada, se usa la compra más reciente de cualquier sede.
- Estados: **Costo completo**; **Costo incompleto** (algún insumo de la receta nunca se compró: se muestra el costo parcial como "≥", sin margen); **Sin receta**. Nunca se asume costo 0.
- Arriba de la tabla: ganancia bruta y margen % del período, **solo sobre platos con costo completo**, diciendo cuántos quedaron fuera.
- `kpis_inventario` se redefine en la misma `0012` (no se edita la `0011`, ya aplicada) con `costo_unitario` y `valor_stock`. La tabla de rotación suma la columna **"Valor en stock"**: stock × costo, o "—" si el insumo nunca se compró.

### Ojo con los datos de hoy

Solo 1 de 46 platos tiene receta y hay 1 compra registrada, así que casi todo sale "Sin receta". El cálculo está listo; se va llenando a medida que se carguen recetas (Administración → Menú) y se reciban compras.

### Idea para César (Fase 4, no se tocó)

`costo_estimado` es el precio estimado al crear la orden, no el de la factura. Si al marcar una orden como "recibida" se confirmara el costo real, la rentabilidad sería exacta.

### Archivos

| Archivo | Cambio |
| --- | --- |
| `supabase/migrations/0012_rentabilidad.sql` | Nuevo — vista `costo_insumo_actual`, función `kpis_rentabilidad`, `kpis_inventario` con valor en stock |
| `src/models/types/kpis.ts`, `src/models/types/index.ts` | `RentabilidadPlato`, `EstadoCostoPlato`; costo y valor en `RotacionInsumo` |
| `src/models/services/kpisService.ts` | `fetchKpisRentabilidad` |
| `src/controllers/gerencia/useKpisVentas.ts` | Carga la rentabilidad y calcula el resumen de margen |
| `src/views/modules/gerencia/components/TablaRentabilidad.tsx` | Nuevo — tabla por plato |
| `src/views/modules/gerencia/components/TablaRotacion.tsx` | Columna "Valor en stock" |
| `src/views/modules/gerencia/GerenciaPage.tsx` | Sección "Rentabilidad por plato" |

### Pendiente

- [x] `0012_rentabilidad.sql` aplicada por Pedro en el SQL Editor (2026-10-15).
- [x] Verificado contra un cálculo directo con la cuenta de gerencia: costo de "por lote" $30/kg (única compra recibida); valor en stock $1.080 (36 kg × $30); el plato "prueba" (precio $15, receta 1 kg) cerrado en la mesa 4 da costo $30, margen −$15 (−100 %) y ganancia −$30 por 2 vendidos; los otros 8 platos vendidos salen "Sin receta". Sin sesión, la función y la vista quedan bloqueadas.
- [x] Fase 5, Módulo 1 marcado ✅ en el roadmap.

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

- [x] `0011` aplicada y verificada (2026-10-15): 40 kg de entradas, 2 kg consumidos, 2 kg de merma, 36 kg de stock, rotación 0,22×, coincide con los movimientos reales.
- [x] Rentabilidad por plato: resuelto en la entrada de arriba (costo = última compra recibida).

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
