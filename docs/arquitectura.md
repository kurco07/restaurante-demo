# Plataforma de gestión integral para restaurantes
## Documento de arquitectura y alcance — v0.1 (documento vivo)

> Este documento se irá actualizando en cada conversación. No es una especificación cerrada — es el mapa que estamos construyendo juntos. Última actualización: 20 de agosto de 2026.

---

## 0. Cómo usar este documento

Cada sección tiene partes ya definidas y partes marcadas como 🔲 **Pendiente de definir**. A medida que resolvamos preguntas, actualizo el documento. El orden de trabajo acordado es:

1. Estructura y alcance de cada módulo (este documento)
2. Interfaz (flujos de pantalla, wireframes conceptuales)
3. Integraciones (pagos, impresoras, POS existentes, proveedores)

---

## 1. Visión general

Plataforma web para restaurantes que cubre cuatro frentes: **operación diaria** (mesoneros, autopedido del cliente, cocina), **administración y gerencia** (inventario, compras, reportes), **inteligencia artificial** (sugerencias de compra, platos a preparar y recomendados del día) y **experiencia/marca** (realidad aumentada, mapeo de mesas, personalización visual por restaurante).

✅ **Decidido:** es un SaaS — se venderá/licenciará a múltiples restaurantes clientes desde el inicio. Esto significa que el aislamiento de datos por restaurante (multi-tenancy) se diseña desde el día 1, no se agrega después (ver sección 4.9).

---

## 2. Realidad de presupuesto vs. alcance

Pediste que te asesorara sobre qué es eficiente y qué no. Aquí va, con honestidad:

| Módulo | Complejidad relativa | Por qué |
|---|---|---|
| Toma de pedidos (mesonero + autopedido) + cocina (KDS) | Alta | Tiempo real entre mesonero, autopedido del cliente y cocina, **más modo offline con sincronización al volver la conexión** — es de las piezas más exigentes de todo el proyecto |
| Modo offline (operación local) | Alta | Cada dispositivo debe seguir funcionando sin internet y luego sincronizar sin perder ni duplicar pedidos — exige diseño cuidadoso, no solo "guardar y reenviar" |
| Administración/inventario con descuento automático | Media-alta | Requiere modelar recetas (BOM — *bill of materials*) y manejar unidades no exactas (ver sección 5) |
| Gerencia/reportes | Baja-media | Mayormente dashboards sobre datos ya capturados en otros módulos (requieren conexión, no aplica offline) |
| IA de sugerencias (compras, platos, recomendados) | Media | Económico si se usa una API de LLM existente (Claude, GPT, etc.) con buen *prompt engineering* sobre tus propios datos; caro si se intenta entrenar un modelo de forecasting propio desde cero |
| ~~Atención automatizada (chat/asistente IA)~~ | — | **Descartada.** La IA se mantiene en compras, platos y recomendados, pero no como chat conversacional con el cliente |
| Realidad aumentada de platos | Alta | Cada plato necesita un modelo 3D (fotogrametría o modelado manual). Es el módulo que menos escala: 200 platos en el catálogo de un restaurante = 200 modelos 3D |
| Personalización total (self-service) | Media | El *theming* (colores, logo, iconos) es directo; el costo oculto es el QA multiplicado por cada restaurante que use la app |
| Multi-tenant (SaaS) | Alta, pero arquitectónica no de horas-hombre | Se decide en el día 1. Convertir una app de un solo restaurante en multi-tenant después de construida casi siempre implica reescribir buena parte del backend |

**Conclusión honesta:** con el presupuesto de implementación inicialmente planteado, un MVP sólido de operación + administración + IA básica (usando APIs de LLM existentes, no modelos propios) es alcanzable. **Realidad aumentada completa y atención 100% automatizada probablemente no entran en esa primera fase** sin sacrificar calidad en el resto. Lo que sí es realista es dejar la arquitectura *preparada* para agregarlos en fase 2/3 sin rehacer todo.

**Actualización tras tu confirmación:** eligieron SaaS multi-tenant + IA básica + self-service completo para el MVP, y decidieron ampliar presupuesto/timeline de fase 1 en vez de recortar alcance. Con eso, el presupuesto inicialmente planteado pasa a ser un punto de partida más que un techo — es difícil poner una cifra nueva exacta sin haber cerrado interfaz e integraciones, pero como referencia: un alcance así (operación completa + multi-tenant + self-service con cobro automático + IA básica) suele requerir una inversión notablemente mayor a la planteada al inicio. Vale la pena pedir cotizaciones formales a un equipo de desarrollo una vez cerremos todo el documento, en lugar de anclarnos a un número que yo estime aquí sin ver el detalle completo de interfaz e integraciones.

**Segunda actualización:** descartaron el asistente de IA conversacional (atención automatizada) — eso libera presupuesto y tiempo. A cambio, confirmaron que la app debe funcionar en modo offline, que es de las piezas más exigentes técnicamente de todo el proyecto (ver 4.11). En términos de esfuerzo, es un intercambio razonable: se quita algo caro y no esencial ahora mismo, se agrega algo caro pero genuinamente necesario para la operación diaria.

---

## 3. Hoja de ruta sugerida (a validar contigo)

**Fase 1 — v1 completo** (presupuesto/timeline ampliado respecto al planteamiento inicial) ✅ priorización confirmada contigo
- Toma de pedidos (mesoneros + autopedido del cliente) + pantalla de cocina en tiempo real
- **Modo offline:** la operación (pedidos, cocina, mesas) sigue funcionando sin internet y sincroniza al reconectar
- Administración: inventario con descuento automático por receta, compras
- Gerencia: reportes y KPIs básicos
- **IA de sugerencias básica** (compras, platos a preparar, recomendados del día) vía API de LLM sobre los datos de cada restaurante, siempre con aprobación humana
- Mapeo de mesas (editor simple)
- Personalización básica: logo, colores, nombre del restaurante
- Arquitectura multi-tenant desde el inicio, con aislamiento de datos por restaurante
- **Onboarding self-service completo:** registro, cobro con pasarela de pago, aprovisionamiento automático del tenant, panel de configuración inicial
- Facturación recurrente automática (modelo de suscripción mensual)

**Fase 2**
- Reportes avanzados y predicciones de demanda

**Fase 3**
- Piloto de realidad aumentada limitado a "platos estrella" (5-10 platos, no el menú completo)

**Fase 4**
- Realidad aumentada a escala / herramienta para que cada restaurante genere sus propios modelos 3D
- Marketplace de integraciones, panel de auto-gestión avanzado

### 3.1 Onboarding self-service — resuelto ✅

Decidieron ampliar presupuesto/timeline de fase 1 en vez de recortar alcance o hacer una versión ligera. Self-service completo (registro, cobro, aprovisionamiento automático, panel de configuración inicial) queda dentro de fase 1.

---

## 4. Mapa de módulos (borrador funcional)

### 4.1 Atención / Mesoneros y autoatención del cliente
- Toma de pedidos por mesa, modificadores, notas especiales
- Envío en tiempo real a cocina
- División de cuenta, propinas, cierre de mesa
- ✅ **Decidido: modelo híbrido.** El cliente elige: puede pedirle al mesonero, o autoatenderse desde su celular escaneando el QR de la mesa. Ambos caminos alimentan el mismo pedido de la mesa
- **Implicación técnica:** la mesa pasa a ser una "sesión compartida" — mesonero y cliente pueden añadir ítems al mismo pedido en tiempo real, así que hace falta sincronización en vivo entre la tablet del mesonero y el celular del cliente, y una forma clara de "confirmar y enviar a cocina" para que nadie mande el pedido a medias. Suma algo de complejidad al módulo, pero reutiliza el mismo motor de pedidos — no es un módulo aparte, y no compite con el presupuesto del motor de IA ni del self-service
- Esto también deja el terreno preparado para AR en fase 3: el cliente ya está en su celular viendo el menú, así que ahí mismo puede vivir la vista de realidad aumentada más adelante
- ✅ **Decidido: el cierre de cuenta y el pago siempre pasan por el mesonero**, incluso si el cliente pidió por QR. El celular del cliente se usa para pedir, no para pagar
- ✅ **Descartado (por ahora): asistente de IA conversacional para atención al cliente.** La IA se mantiene activa en compras, platos a preparar y recomendados del día, pero no como chat/asistente — se puede reconsiderar más adelante si surge la necesidad

### 4.2 Cocina (Kitchen Display System)
- ✅ **Decidido: una pantalla general** con todo el pedido, no dividida por estación
- Cola de pedidos, tiempos de preparación, alertas de demora
- Debe seguir funcionando en modo offline si se cae el internet del restaurante (ver 4.11)

### 4.3 Administración
- Inventario, entradas/salidas, alertas de stock bajo
- Recetas (BOM) por plato, con manejo de materia prima no exacta (ver sección 5)
- Compras y proveedores
- Conteos físicos y conciliación

### 4.4 Gerencia / Supervisión
- Dashboards de ventas, rentabilidad por plato, rotación de inventario
- Reportes por turno, por mesonero, por período
- Alertas y excepciones (mermas anómalas, descuentos excesivos)

### 4.5 Motor de IA
- Sugerencias de compra de materia prima (basado en consumo histórico + tendencia)
- Sugerencias de qué platos preparar (según inventario disponible y rentabilidad)
- Recomendados del día (para mostrar a mesoneros/clientes)
- ~~Atención automatizada (chat/asistente)~~ — descartada por ahora (ver 4.1)
- ✅ **Decidido: siempre con aprobación humana.** Ninguna sugerencia de la IA se ejecuta sola (ni una orden de compra ni un cambio de menú) — el sistema propone, una persona con el rol adecuado aprueba
- ✅ **Proveedor de IA:** pediste "bueno, bonito, barato, y gratis para pruebas" — el dato concreto: para desarrollo/pruebas, la API de Gemini (Google) tiene un nivel gratuito real, sin tarjeta de crédito, con límites de uso — sirve para probar la lógica de las sugerencias sin gastar. Para producción, los modelos "económicos" de las tres familias (Gemini Flash-Lite, GPT-5 mini/nano, Claude Haiku 4.5) cuestan centavos de dólar por cada mil interacciones — con el volumen de un restaurante, el gasto mensual de IA debería ser bajo frente a la mensualidad del modelo SaaS. Recomiendo construir la capa de IA desacoplada del proveedor (un adaptador en el backend) para poder cambiar de modelo sin reescribir el sistema

### 4.6 Realidad aumentada
- Visualización de porciones/platos en AR desde el dispositivo del cliente
- ✅ **Validado con un prototipo funcional:** `<model-viewer>` (componente web de Google) es la tecnología elegida — 100% web, botón de RA nativo en Android (WebXR/Scene Viewer) y iPhone (Quick Look), sin apps nativas
- ✅ **Diferencias entre el prototipo y la implementación real:**
  - El modelo 3D es un campo más (URL del `.glb`/`.usdz`) en el registro del plato, dentro de la base de datos multi-tenant — no un archivo estático
  - Los archivos se alojan en almacenamiento en la nube + CDN (no empaquetados con el código); el restaurante los sube desde su propio panel, igual que el logo
  - El botón "Ver en RA" vive dentro de la tarjeta del plato en el menú real, y solo aparece en los platos que tengan modelo cargado
  - Carga bajo demanda: el modelo se carga solo cuando el cliente toca "Ver en RA" de ese plato específico, no todos de una vez (importante con menús grandes y datos móviles del cliente)
  - La conversión `.glb` → `.usdz` se automatiza una sola vez en el backend al subir un modelo — el restaurante no debería tener que pensar en formatos
- ✅ **Cómo conseguir los modelos 3D reales:** escanear el plato real con apps de fotogrametría (Polycam, KIRI Engine, Scaniverse, RealityScan Mobile) da resultados mucho más fieles que comprar modelos de stock genéricos. Para escalar a varios restaurantes, un fotógrafo/estudio que visite cada uno y escanee sus platos estrella en una sesión es más realista que pedirle a cada dueño que lo haga solo. Si se compran modelos de stock (Sketchfab, CGTrader, TurboSquid) hay que confirmar que la licencia permita uso "multi-cliente" de un SaaS, no solo "uso comercial" genérico
- 🔲 Pendiente: alcance final (cuántos "platos estrella" por restaurante, quién hace el escaneo — el equipo del SaaS o el propio restaurante)

### 4.7 Personalización / Branding
- Colores, logo, iconos, imágenes por restaurante
- ✅ **Propuesta (se desprende de la decisión de self-service):** cada restaurante configura su propia marca dentro del panel de configuración inicial del onboarding — no ustedes por cliente. Encaja con el modelo self-service ya confirmado; dímelo si preferían configurarlo ustedes como parte del "setup" de cada cliente nuevo

### 4.8 Mapeo de mesas
- Editor visual de plano del salón, a criterio de cada restaurante
- Estado de mesas en tiempo real (libre, ocupada, por limpiar)

### 4.9 Infraestructura y multi-tenancy
- **Modelo confirmado:** SaaS multi-tenant desde el día 1
- Aislamiento de datos por restaurante ("tenant"): lo habitual es una base de datos compartida con un `tenant_id` en cada tabla — más económico que una base de datos separada por cliente, y más que suficiente para el volumen de datos de un restaurante
- Cada restaurante accede por su propio subdominio o enlace (ej. `nombrerestaurante.tuapp.com`) o mediante login con selección de sede
- Panel de "super-admin" para el equipo del SaaS: alta de restaurantes, ver uso, soporte — en fase 1 puede ser interno y manual, no expuesto al cliente
- ✅ **Multi-sede — propuesta (no lo habían pensado, sigo con esta base):** un tenant por restaurante/cadena, con soporte para varias sedes dentro de ese mismo tenant. Cada sede tiene su propio inventario, mesas y equipo de trabajo, pero la gerencia puede ver reportes consolidados de toda la cadena o filtrar por sede individual. Es el modelo más flexible: cubre tanto al restaurante de una sola sede como a una pequeña cadena, sin duplicar cuentas ni facturación. Dímelo si preferían que cada sede fuera un tenant independiente
- ✅ **El detalle de tablas, campos y relaciones vive en un documento aparte: Modelo de Datos.**
- ✅ **Organización del código del frontend: patrón MVC adaptado a React** (`models/` para tipos y llamadas a Supabase, `views/` para componentes y módulos de UI, `controllers/` para los hooks que los conectan). El detalle completo vive en `docs/estructura-mvc/README.md`.

### 4.10 Seguridad y roles
- Roles base: mesonero, cocina, supervisor de sala, administración, gerencia/dueño, super-admin (equipo del SaaS)
- ✅ **Propuesta de jerarquía real de restaurante** (a revisar y ajustar contigo):

| Rol | Puede | Necesita un rol superior para |
|---|---|---|
| Mesonero | Tomar/editar pedidos de sus mesas, marcar mesa libre/ocupada, solicitar cierre de cuenta | Anular ítems ya enviados a cocina, aplicar descuentos, ver costos/inventario/reportes |
| Cocina | Ver la cola de pedidos, marcar en preparación/listo, avisar demoras | Editar el contenido de un pedido, ver precios, entrar a otros módulos |
| Supervisor de sala | Todo lo del mesonero + anular ítems (construido, 2026-10-16), transferir mesas entre mesoneros (construido, 2026-10-16), reportes del turno (con la Fase 5, Módulo 2). Descuentos menores: fuera por ahora, decisión de Pedro (2026-10-16) | Tocar inventario/recetas, ver reportes financieros globales, configurar la cuenta del restaurante |
| Administración | Inventario, compras, recetas (BOM), proveedores, conteos físicos | Anular cuentas ya cerradas, cambiar roles de usuarios |
| Gerencia / Dueño | Su propio panel (`/gerencia`): reportes financieros completos, rentabilidad, rotación de inventario y recetas en solo lectura; acceso a Mesoneros y Cocina; anular cuentas cerradas, gestionar usuarios y roles, ver todas las sedes de su restaurante | Administrar otros restaurantes (tenants) — eso es del super-admin. **No entra al módulo de Administración** (ver nota abajo) |
| Super-admin (equipo del SaaS) | Alta de restaurantes, ver uso/facturación agregada, soporte técnico | Ver el detalle operativo día a día de un restaurante, salvo soporte puntual autorizado |

- ✅ **Decidido (2026-10-15, Pedro):** gerencia **no** entra al módulo de Administración. Tiene su propio panel con barra lateral (Ventas, Rentabilidad, Inventario, y luego Reportes por turno, Sedes y Alertas), donde ve la información de inventario y recetas en solo lectura. Motivo: un gerente de cadena puede tener `sede_id` nulo, y las pantallas de Administración trabajan sobre una sede; además, operar el inventario es tarea de administración, no de gerencia. Esto es solo el acceso del frontend (`rolesPorModulo.ts`): las políticas RLS siguen dejando que gerencia lea y escriba las tablas de inventario de su tenant
- 🔲 Pendiente: revisar el resto de esta tabla y ajustarla — es una propuesta basada en cómo suele jerarquizarse un restaurante real, no una decisión cerrada

### 4.11 Arquitectura offline (PWA local-first)
- ✅ **Decidido:** la operación debe seguir funcionando si se cae el internet del restaurante
- Aplica sobre todo a **mesoneros, autopedido del cliente y cocina** — son los módulos que no pueden detenerse durante un servicio
- Los módulos que dependen de la nube por naturaleza (IA, reportes consolidados de varias sedes, panel de super-admin, facturación) seguirán requiriendo conexión — no tendría sentido, por ejemplo, que una sugerencia de compra funcione con datos desactualizados
- Se resuelve como **PWA (Progressive Web App)**: sigue siendo 100% web, pero con caché local y sincronización en segundo plano al reconectar — no hace falta salir de "todo web" para lograr esto
- **Nota honesta de complejidad:** combinar tiempo real (mesonero + cliente + cocina viendo la misma mesa) con modo offline (cualquiera de los tres puede quedarse sin internet y luego reconectar) es de las partes más exigentes técnicamente de todo el proyecto. Hay que decidir qué pasa si dos dispositivos modifican el mismo pedido mientras están offline y luego sincronizan — es resoluble, pero merece diseño dedicado antes de programarlo
- ✅ **Propuesta (no lo habían definido, sigo con esta base):** diseñar para aguantar varias horas sin internet — el equivalente a un turno completo de servicio — no solo unos minutos de gracia. Es más seguro apuntar alto aquí: subestimar la ventana offline es lo que rompe la confianza en el sistema el día que de verdad se cae el internet. Dímelo si con unos minutos les basta, sería más simple de construir

---

## 5. Nota técnica: descuento de inventario con materia prima no exacta

Mencionaste que hay materia prima que no se puede contabilizar con exactitud en porciones (ej. una salsa preparada en lote, condimentos, aceite). El enfoque estándar para esto:

- **Insumos exactos** (ej. una proteína de 200g por plato): descuento directo por receta.
- **Insumos por lote** (ej. una salsa que rinde 40 porciones): se descuenta como fracción del lote, y el sistema debe permitir "cerrar" un lote y registrar la merma real vs. la teórica.
- **Insumos estimados** (ej. condimentos "al gusto"): se manejan con un costo promedio estimado por plato, ajustable, y **no** se intenta rastrear con precisión unidad por unidad — perseguir precisión ahí cuesta más de lo que vale.

🔲 Pendiente: revisar esto contigo plato por plato cuando lleguemos al detalle de inventario.

---

## 6. Registro de decisiones pendientes (se irá marcando ✅ a medida que resolvamos)

**Negocio**
- [x] ¿Single-restaurante o SaaS multi-tenant? → **SaaS multi-tenant desde el inicio**
- [x] Prioridades del MVP dentro del presupuesto inicial planteado → **Base operativa + IA de sugerencias básica, sin AR**

**Técnico**
- [x] Dispositivos de mesoneros/cocina → **tablets vía navegador web, confirmado**
- [x] Proveedor de IA → **capa desacoplada de proveedor; Gemini para pruebas (tier gratuito), modelo económico a definir para producción**
- [x] ¿Necesita funcionar offline (sin internet) en el restaurante? → **sí, arquitectura PWA local-first (ver 4.11)** — falta definir cuánto tiempo debe aguantar sin conexión
- [x] Un restaurante con varias sedes → **un tenant por cadena con varias sedes dentro (propuesta, a confirmar)**

**Producto**
- [ ] Alcance real de AR (todo el menú vs. platos selectos) — ya sabemos que se pospone a fase 3
- [x] Alcance real del **asistente de IA por chat** → **descartado por ahora**; la IA sigue activa en compras, platos y recomendados del día, no como chat conversacional
- [x] Nivel de autonomía de la IA → **siempre con aprobación humana**
- [x] Onboarding en fase 1 → **self-service completo, con presupuesto/timeline de fase 1 ampliado**
- [x] Pedidos: mesonero o autoatención del cliente → **híbrido, el cliente elige en cada mesa**
- [x] Pago desde el celular en autoatención → **no, el cierre de cuenta siempre pasa por el mesonero**

**Integraciones** (etapa 3 de tu plan de trabajo — no bloquean el resto del documento)
- [ ] Pasarelas de pago a integrar — aún sin definir, se resuelve en la etapa de integraciones
- [ ] Impresoras de tickets / comandas — pendiente
- [ ] ¿Ya usan algún POS que deba conectarse o migrarse? — aún no lo saben; diseñamos el resto con puntos de integración abiertos (APIs) para no cerrar esa puerta

---

*Próxima sección a desarrollar: respuestas a las preguntas de este documento, luego detalle profundo de cada módulo.*
