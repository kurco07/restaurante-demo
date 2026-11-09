# Nota para Pedro — personalización de marca y otros pendientes sueltos

De: César (con Claude Code). Fecha: 2026-11-07.

## Resumen en una línea

César va a estar ocupado un tiempo. Esta nota deja explícito en qué quedó el "sistema de personalización muy completo" que pidió (colores, logo, marca de agua, redes sociales — todo ya en `main`, migraciones hasta la `0042` corridas), qué falta para que sea total, y una lista corta de otros pendientes sueltos que no son de personalización. **Tienes permiso total de cambiar, recortar o rehacer cualquier cosa de esta lista si te parece mejor** — es una guía de lo que se discutió con César, no una especificación cerrada. Sigue haciendo tus commits en tu propia rama; César los fusiona a `main` cuando pueda.

---

## 1. Personalización de marca — qué ya quedó hecho (todo en `main`)

Tabla `personalizacion_marca`, editor en Administración → Configuración → "Marca del restaurante" (`ColoresMarcaSeccion.tsx`), aplicado en tiempo de ejecución por `useAplicarMarca.ts` (variables CSS en `document.documentElement`). RLS: lectura abierta al tenant, escritura solo administración/gerencia (migración `0025`).

- **Logo**: sube a Storage (bucket `marca`), con sello de tiempo en la URL para evitar que el navegador muestre el logo viejo desde caché después de reemplazarlo.
- **Colores primario, secundario y de acento**: los tres se aplican de verdad en **todas** las pantallas — Administración, Gerencia, Mesoneros, Cocina, Inicio público y Autopedido QR. Esto costó dos rondas de arreglos:
  1. Dos constantes viejas (`ESTILOS_ADMIN` en `src/views/components/ui/constants.ts`, `ESTILOS_CSS` en `src/views/modules/pedidos/components/constants.ts`) traían `--orange`/`--orange-dark` fijos por código, de antes de que existiera la personalización, y tapaban el valor dinámico en Administración/Gerencia/Mesoneros/Cocina. Ya se quitaron esas dos llaves de ambas constantes — **importante si agregas una constante de estilos nueva: nunca fijes `--orange`/`--orange-dark`/`--acento` ahí, se heredan solas desde la raíz del documento.**
  2. ~120 elementos en 18 archivos (Inicio, Autopedido, Mesoneros, Cocina) tenían el naranja escrito directo como clase de Tailwind (`bg-orange-500`, `text-orange-600`, etc.) en vez de `bg-[var(--orange)]`/`text-[var(--orange-dark)]`. Ya están convertidos. **Si agregas una pantalla nueva o un botón nuevo: usa siempre `var(--orange)` / `var(--orange-dark)` / `var(--orange-bg)` / `var(--acento)`, nunca la paleta naranja fija de Tailwind — si no, no va a responder a la marca del tenant, aunque compile y se vea bien con los colores por defecto.**
  - Quedaron **a propósito** sin convertir (son código de semáforo funcional, no decoración, y abrirlos a cualquier color del tenant podría chocar con los otros estados fijos): el color "mesa tuya" en el mapa de mesas del mesonero, y las columnas pendiente/en preparación/listo de Cocina (`puntoColor`/`botonColor` en `TableroCocina.tsx`). Tampoco se tocaron los gradientes decorativos de Inicio (categorías, slides del carrusel) — son variedad visual a propósito.
- **Tipografía**: selector con 6 fuentes curadas de Google Fonts (`fuentesMarca.ts`), se inyecta el `<link>` solo si el tenant eligió una.
- **Marca de agua**: el logo del tenant de fondo, discreto, en todas las pantallas (incluyendo mesonero/cocina, sin estorbar). Interruptor de encendido, slider de opacidad (2%–15%) y slider de tamaño (200px–900px).
- **Color de la barra lateral** (Administración/Gerencia): antes usaba `--ink`, la misma variable del texto de toda la app, así que no se podía abrir sin arriesgar legibilidad en el resto de las pantallas. Ahora tiene su propia variable (`--sidebar-bg`/`--sidebar-text`) y el texto se calcula solo (blanco o casi-negro) según qué tan clara sea la barra, para que cualquier color que elija el tenant siga siendo legible.
- **Redes sociales**: Instagram, WhatsApp (botón de **contacto**, nunca para pedir — los pedidos siguen siendo solo por QR en la mesa, es una regla de `CLAUDE.md`), Facebook y un enlace libre con etiqueta propia (TikTok, sitio, Google Maps…). Aparecen en el pie de la página pública `/inicio` (`RedesSociales.tsx`), solo los que el tenant llenó. **A propósito no se agregaron a Autopedido**: ahí la prioridad es pedir, no navegar redes — si lo revisas y no estás de acuerdo, es tu criterio, cámbialo.

**Un bug que vale la pena que conozcas si tocas subida de archivos en algún otro lado**: el logo se sube siempre a la misma ruta de Storage (`marca/<tenant_id>/logo.<ext>`), así que la URL pública quedaba idéntica entre subidas y el navegador seguía mostrando la imagen vieja desde caché. El arreglo fue agregar `?v=<timestamp>` a la URL en cada subida (`subirLogoMarca()` en `marcaService.ts`). Si construyes el sistema de fotos de platos (punto 2 de abajo) o cualquier otra subida a un path fijo, vas a tener el mismo problema — aplica el mismo patrón.

---

## 2. Lo que falta para que la personalización sea "total" — en orden sugerido

### 2.1 Fotos reales de los platos (la que ya está anotada en el Roadmap, Fase 7)

Es el pendiente que quedó abierto al cerrar tu Fase 6 (`Roadmap_Construccion_MVP.md`, línea ~279): una foto por plato, subida una sola vez en Administración → Menú, mismo patrón de bucket que los modelos 3D (`0013`) y el logo (`0025`). La usarían el menú del mesonero, el QR, los recomendados del día y la RA.

El dueño ya decidió el alcance más amplio cuando hablamos de personalización completa: **no es solo fotos de platos — también imágenes generales del restaurante** (para el home público, por ejemplo), todo gestionado desde Configuración, con acceso rápido desde Administración → Menú para las de platos específicamente. Sigue habiendo dos preguntas abiertas que el Roadmap ya marcaba y que te tocan a ti:

- **¿En qué fase va?** — Aquí (como personalización, Fase 7) o en la Fase 9 (con la interfaz final). Esta es tu llamada; no hay una respuesta correcta predefinida.
- **¿Quién sube las fotos?** — ¿El restaurante mismo desde su panel, o alguien del equipo?

Es el ítem más grande de todos los de esta nota — **avísale a César antes de empezarlo en serio**, porque toca directamente tu código del menú (`MenuAdmin.tsx` y afines) y conviene coordinar para no pisarse.

### 2.2 Forma y estilo (bordes redondeados vs. rectos)

El dueño lo mencionó en su pedido original ("letras tanto tamaños colores y **estilo**") y nunca se construyó nada. La idea más simple y de bajo riesgo: 2–3 presets de `border-radius` (por ejemplo "redondeado" como está hoy, "suave", "recto") aplicados vía otra variable CSS (`--radio-base` o similar) que reemplace los `rounded-*` fijos de Tailwind en los componentes compartidos (botones, tarjetas, modales) — mismo patrón que los colores. No llegué a tocarlo, pero es rápido de construir siguiendo el mismo mecanismo que ya existe.

### 2.3 Tamaño de letra y color de fondo/texto general — declinados por ahora, no por olvido

Dos cosas que el dueño pidió y que se decidió **a propósito** dejar fuera de esta ronda, con razón técnica real, no por recortar alcance:

- **Tamaño de letra**: casi todos los textos de la app son clases de Tailwind con píxeles fijos (`text-[13px]`, `text-[27px]`, etc.) en cientos de archivos, no `rem` relativos a una variable. Abrir esto de verdad significaría reescribir esas clases en toda la app — un proyecto en sí mismo. Si algún día se retoma, la alternativa rápida pero imperfecta es un `zoom` de CSS (escala todo proporcionalmente, íconos e imágenes incluidos).
- **Color de fondo/texto general** (`--bg`/`--ink`): todo el diseño asume fondo claro y texto oscuro. Abrir esos dos colores a cualquier valor que elija el tenant arriesga que el texto deje de leerse en decenas de pantallas a la vez, sin un rediseño "theme-aware" real primero.

Mi recomendación honesta: **esto probablemente tiene más sentido en la Fase 9** (Módulo 1, "Sistema de diseño" — paleta, tipografía y espaciado consistentes desde cero), no intentarlo ahora encima del código actual. Pero es tu criterio si lo ves distinto.

### 2.4 Animaciones

El dueño dijo explícitamente "a futuro cuando las coloquemos" — ya está en el Roadmap como Fase 9 completa (con Motion/Framer Motion recomendado ahí mismo). No hay nada que hacer en personalización respecto a esto todavía.

---

## 3. Otros pendientes sueltos (no son de personalización, pero quedaron anotados en esta conversación)

- **Botones de "notificaciones" y "perfil"** en el panel principal de Administración — están en la interfaz pero no hacen nada. El dueño los vio y pidió dejarlos "para después" explícitamente, sin decidir aún qué deberían hacer.
- **Moneda / multi-moneda**: el campo "Moneda" en Configuración → Facturación existe pero está deshabilitado (muestra "USD ($)" fijo) — el dueño no ha decidido el alcance todavía, no asumas nada ahí sin preguntarle primero (regla de `CLAUDE.md`).
- **Métodos de pago editables de verdad**: los interruptores de "Efectivo/Tarjeta/Pago móvil" en Configuración existen pero no están conectados al flujo real de cobro (`CierreCuentaModal.tsx`) — tocarlo implica cambiar el checkout real, se dejó pendiente a propósito.
- **Tenant de prueba sobrante** ("Restaurante Verificación…", de cuando se probó el registro self-service en la Fase 7) — nunca se borró. El dueño pidió ignorarlo por ahora, pero en algún momento habría que limpiarlo.
- **`docs/BUGS.txt`**: tiene un bug anotado de hace rato, sin resolver — "se duplica el identificador de mesa actual si se selecciona otra mesa, esto pasa indefinidamente". No lo investigué en esta ronda, pero sigue ahí.
- **Fase 8, Módulo 1** (prueba offline con dispositivos reales): según el Roadmap, lo dejaste preparado pero todavía falta correr la prueba con dispositivos de verdad. Esto es tuyo, solo lo anoto por si se había perdido de vista.
- **La corrección de PowerSync que agregué sin que la hayas probado tú**: durante la revisión de tu `feature/fase8-errores-carga` encontré que `uploadData()` en `powerSyncClient.ts` solo descartaba errores `P0001` (rechazos de triggers) pero no `42501` (RLS deniega el permiso) — un `42501` sin descartar deja la cola de PowerSync trabada para siempre, bloqueando todos los cambios siguientes de ese dispositivo en silencio. Lo arreglé tratando `42501` igual que `P0001`. La lógica está revisada y el build compila, pero no lo probé en vivo forzando un `42501` real (habría que armar un escenario de permisos a propósito) — si tienes oportunidad de probarlo de verdad, mejor.

---

## Estado del repo ahora mismo

- `main` tiene todo lo de la sección 1, confirmado desplegado en producción (`beta-restaurant-ten.vercel.app`).
- Migraciones aplicadas hasta la `0042` inclusive (`supabase/migrations/0025_personalizacion_marca_bucket.sql` hasta `0042_redes_sociales_en_menu_publico.sql`) — todas ya corridas en Supabase, no hace falta volver a correrlas.
- No hay ninguna rama tuya con trabajo sin revisar ni fusionar de mi lado.
