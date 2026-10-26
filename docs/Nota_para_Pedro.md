# Nota para Pedro — qué pasó desde tu último merge y qué sigue

De: César (con Claude Code). Fecha: 2026-10-26.

## Resumen en una línea

Tu Fase 5 (`feature/fase5-alertas`) ya está fusionada y **en producción**, confirmada funcionando en vivo. Desde entonces se adelantó Realidad Aumentada para marketing, se hizo real el home público, se le agregó una capacidad al supervisor, y se encontraron y arreglaron dos bugs serios de offline que llevaban tiempo sin probarse a fondo. Todo esto ya está en `main` y desplegado — no hay ningún PR tuyo pendiente de revisar ni ninguna migración tuya sin correr.

---

## 1. Tu Fase 5 — confirmada en producción

Seguí los pasos de tu `Nota_para_Cesar.md` al pie de la letra: el PR #1 se fusionó limpio (fast-forward, sin conflictos), las tres migraciones (`0018`, `0019`, `0020`) ya estaban aplicadas como dijiste, y verifiqué con un subagente que el build compila y la lógica de RLS/multi-sede es correcta antes de fusionar.

Dos cosas tuyas quedaron anotadas como pendientes de **confirmación del dueño/gerente real** (no mía, no tuya — decisión de negocio), por las reglas de `CLAUDE.md` de no asumir decisiones de producto:
- Los umbrales fijos de las 6 alertas, sin poder configurarlos por restaurante.
- Reemplazar "reportes por turno" por "reporte por día calendario".
- Que las alertas no tengan "marcar como revisada".
- Que supervisor solo vea el reporte de hoy/su sede sin costos, y administración no vea estos reportes.

No las cambié — están tal como las dejaste, solo marcadas para que alguien se lo confirme al dueño cuando se pueda.

Hubo un problema aparte, **no de tu código**: el deploy a producción se quedó bloqueado como 40 minutos (algo del plan Hobby de Vercel relacionado con que tus commits vienen de un colaborador externo). El usuario lo resolvió del lado de Vercel. Anotado en la sección 5 abajo porque te puede pasar a ti también si vuelves a hacer un push grande.

---

## 2. Lo que se construyó después de tu merge

### Realidad Aumentada ("Ver en RA")
Adelantada fuera de orden del roadmap, por pedido explícito del dueño para un video de marketing. Un botón "Ver en RA" en el detalle de plato (mesonero y autopedido QR) abre una **pestaña nueva del navegador** con AR.js (marcador tipo Hiro, no ARCore/WebXR nativo — se probó que ARCore no es confiable en gama media como Xiaomi/Redmi). Quedó en su propia pestaña (ruta pública `/ar`) a propósito: hubo un bug real de Android/Chrome donde `window.innerWidth`/`innerHeight` quedaban corruptos después de usar la cámara en pantalla completa, y aislarlo en otra pestaña evita que eso le pegue a la página de pedidos.

Si tocas `ModalPersonalizacion.tsx`, `HojaPersonalizacion.tsx`, o agregas un modelo 3D nuevo, mira `src/views/components/ui/abrirVistaAR.ts` y `src/views/modules/ar/VistaARPage.tsx`.

### Home público real (`/inicio`)
Dejó de ser el mockup estático tuyo/de Cesar — ahora trae el menú real (13 categorías, 46 platos) vía una función nueva `menu_publico_tenant` (migración `0017`, mismo patrón que tu `menu_publico_mesa` pero sin mesa). El tenant queda fijo por ahora (un solo restaurante piloto); la idea a futuro es un link único por restaurante, todavía no construido. Sigue siendo solo vitrina — pedir de verdad sigue siendo siempre por mesa.

### Supervisor: "Anular cuenta completa" + mesa se libera sola
Encima de tu trabajo de anular/transferir (migración `0015`):
- Botón para anular de una vez todos los platos activos de una mesa (antes solo uno por uno). `anularSesionCompleta()` en `pedidoService.ts`.
- Migración `0016`: si se anulan TODOS los platos activos de una mesa (nada entregado tampoco), la mesa vuelve sola a "libre" — a diferencia del cierre normal que la deja "por limpiar", porque acá no llegó nada físico a la mesa.

### Arreglado: offline no funcionaba de verdad
El usuario probó offline en serio por primera vez (mesonero, en su teléfono) y encontró que **recargar la página sin internet mandaba a login y no dejaba entrar**. Dos causas reales, las dos arregladas:
1. El perfil del usuario (`tenant_id`/`sede_id`/`rol`) se pedía por un fetch directo a Supabase, sin fallback offline. Ahora `UsuarioProvider.tsx` lee de la base local de PowerSync (`usuarios` ya es una de las tablas sincronizadas), igual que el resto de la app.
2. Si el token de sesión ya había expirado de verdad, `getSession()` intentaba renovarlo, fallaba por falta de red, y el SDK trataba la sesión como inválida. `AuthProvider.tsx` ahora guarda su propia copia de la última sesión válida y la usa como respaldo offline (con límite de 4 segundos de espera, para no quedarse colgado esperando un fetch que nunca va a responder).
3. La más gorda: el service worker de la PWA **nunca cacheaba los `.wasm` de PowerSync** (`vite.config.ts` — el glob pattern no incluía `wasm`). Sin eso, el motor de SQLite local ni siquiera podía abrir la base offline. Esto estaba roto desde que existe el modo offline, simplemente nunca se había probado a fondo con una recarga real sin red.

Con esto, el **Fase 2, Módulo 4** del roadmap (prueba real de sincronización offline) está arreglado y confirmado — pero **solo para mesonero** (lo único que el usuario probó hasta ahora, en su teléfono). Falta repetir la misma prueba real con **cocina** (el otro rol que `CLAUDE.md` exige que funcione sin internet) antes de marcar el módulo como cerrado del todo — la arquitectura es la misma (PowerSync + los mismos `AuthProvider`/`UsuarioProvider` corregidos), así que debería funcionar igual, pero no está confirmado todavía. Si tú o tu IA tocan `vite.config.ts`, `AuthProvider.tsx`, o `UsuarioProvider.tsx`, lean los comentarios ahí antes de cambiar nada — cada uno explica el bug real que arregla.

---

## 3. Decisiones de producto pendientes de confirmar con el dueño

Van juntas para que quien hable con él las repase todas de una vez:
- Las 5 de tu Fase 5 (arriba, sección 1).
- "Aplicar descuentos menores" (lo único que falta de tu Fase 2, Módulo 7) — el usuario dijo explícitamente que queda para después, no es urgente.

---

## 4. Lo que sigue en el Roadmap

Con Fase 2 (Módulo 4 arreglado, falta confirmar offline en cocina) hasta Fase 5 completas, lo siguiente es:

**Fase 6 — Inteligencia artificial.** Módulo 1 es la capa adaptadora del proveedor de IA (empezar con Gemini por el nivel gratuito). Regla dura del proyecto, no negociable: **ninguna sugerencia de la IA se ejecuta sola**, siempre la aprueba una persona (`sugerencias_ia` con estado pendiente).

Después de eso: Fase 7 (multi-tenant real/negocio/self-service), Fase 8 (endurecimiento y piloto), Fase 9 (interfaz pulida final) — en ese orden, según el Roadmap.

---

## 5. Nota operativa sobre deploys (para que no te pase a ti)

Encontramos que el deploy automático de Vercel por `git push` **no actualiza el dominio de producción** (`beta-restaurant-ten.vercel.app`) — solo los alias automáticos de git (`*-git-main-*.vercel.app`). Hace falta correr `npx vercel --prod --yes` a mano después de cada push a `main` para que el dominio real se actualice. Si haces un push grande y no ves tus cambios en `beta-restaurant-ten.vercel.app`, es casi seguro por esto, no un bug tuyo.

También: si tu próximo push se queda muchos minutos en "Building…"/estado "UNKNOWN" (normal es ~20 segundos), puede ser el mismo bloqueo de colaborador de plan Hobby que tuvimos hoy — pídele al dueño que lo revise en el dashboard de Vercel antes de asumir que es un error de build.

---

## Estado del repo ahora mismo

- `main` tiene todo lo de arriba, confirmado desplegado y funcionando.
- No hay ramas tuyas con trabajo sin fusionar.
- Migraciones aplicadas hasta `0020` inclusive (la `0016` y `0017` son de esta ronda — anular cuenta completa/mesa libre y menú público por tenant; la `0018`-`0020` son las tuyas). Todas ya corridas en Supabase, no hace falta volver a correrlas.
