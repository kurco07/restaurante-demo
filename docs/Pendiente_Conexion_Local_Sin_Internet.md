# Pendiente: mesonero y cocina conectados sin internet

Anotado por Pedro con Claude Code el **2026-11-14**. **Sin decidir:** queda para más adelante. No se construyó nada. Aquí está todo lo que se conversó, para retomarlo sin tener que volver a investigar.

## Lo que quiere Pedro
Que mesonero y cocina **se vean entre ellos aunque se caiga el internet del restaurante**: que el pedido que envía el mesonero le llegue a cocina, y que los cambios de cocina (en preparación, listo) le lleguen al mesonero, sin depender de internet.

## Cómo funciona hoy y por qué no se ven
- Cada tablet y celular guarda su **propia copia** de los datos (PowerSync, una base SQLite dentro del navegador), así que **cada uno sigue funcionando solo sin internet**. Eso se probó con dispositivos reales en el Módulo 1 de la Fase 8.
- Esas copias se sincronizan **a través del servidor en internet** (Supabase + PowerSync), **nunca directamente entre dispositivos**.
- Por eso, sin internet, lo que envía el mesonero **le llega a cocina recién cuando vuelve la conexión**, en el dispositivo del mesonero o en el de cocina, el que vuelva primero. Está anotado como comportamiento esperado en `docs/Pruebas_Offline_Fase8.md`.

## Los límites de los navegadores (por qué no es simple)
1. **Un navegador no puede hacer de servidor.** Una pestaña de la app no puede recibir conexiones de otros dispositivos. Es una regla de seguridad de todos los navegadores y no se puede saltar.
2. **Conectar dos navegadores directamente (WebRTC)** necesita un servidor que los "presente" (señalización), y ese servidor está en internet.
3. **La app se abre por `https`**, obligatorio para que sea instalable (PWA) y funcione sin internet. El navegador **bloquea** que una página `https` se conecte a un equipo de la red local (`http://192.168.x.x`) si no tiene un **certificado de seguridad válido**, y además restringe el acceso a la red privada. Servir la app por `http` desde la red local tampoco sirve, porque sin `https` no funciona el modo sin internet ni la instalación.
4. **Bluetooth desde el navegador** (Web Bluetooth) solo puede conectarse *a* otros aparatos, no hacer de aparato al que otros se conectan. No sirve para esto.

## Las opciones

### Opción 1: internet de respaldo *(la recomendada para el piloto y el MVP)*
Que el restaurante **nunca se quede del todo sin internet**. Variantes:
- **la tablet de cocina con datos móviles** (chip propio);
- **un router con respaldo 4G**, que entra solo cuando falla la línea principal;
- **un celular con datos compartiendo su conexión** (punto de acceso) para mesonero y cocina.

Con cualquiera, mesonero y cocina siguen conectados por el servidor, como siempre.
- ✅ No hay que programar nada, funciona con la app tal como está, es barato y no rompe ninguna regla del proyecto.
- ❌ Depende de que haya señal de datos en el local.

### Opción 2: un servidor dentro del restaurante
Un **equipo siempre encendido** en el local, conectado al Wi-Fi, con un programa nuestro que hace de **puente local**: una Raspberry Pi o un mini PC (unos 50 a 100 dólares), o una laptop vieja.

**Cómo funcionaría:**
1. **Con internet**, todo igual que hoy, a través de Supabase.
2. **Sin internet**, el mesonero manda sus pedidos también al puente local por el Wi-Fi, cocina los recibe de ahí, y los cambios de cocina vuelven al mesonero por el mismo camino.
3. **Al volver el internet**, cada dispositivo sube sus cambios a Supabase como siempre. **Supabase sigue siendo la fuente de verdad.**

**Lo que lo hace difícil:**
- **El certificado de seguridad, lo más difícil.** El equipo local necesita un nombre de dominio con certificado válido (por ejemplo `local.roof.app`, con un certificado de Let's Encrypt instalado en el equipo). Además, el **router del restaurante** tiene que saber, sin internet, que ese nombre apunta al equipo (una entrada de DNS local en el router), porque sin internet no se puede consultar el DNS público. Es configuración de red **en cada restaurante**.
- **No duplicar pedidos.** Un pedido que llega a cocina por el puente local y después también por Supabase no puede contarse dos veces ni disparar dos veces los procesos de la base: descuento de inventario, unión de cuentas (`0031`/`0032`/`0044`) y anulaciones. Lo que llega por el puente tendría que guardarse en tablas locales aparte, que no se suban como cambios propios del dispositivo, y respetar los mismos `id` y `client_local_id`.
- **Es una segunda forma de sincronizar** al lado de PowerSync: más código, más casos raros y más pruebas.
- **Hay que instalar, configurar y mantener el equipo en cada restaurante**, incluidas actualizaciones y qué pasa si se apaga o se desconecta.
- **Va en contra de una regla de `CLAUDE.md`:** "sin hardware propietario: todo corre en un navegador estándar". Un mini PC común no es hardware propietario, pero es un equipo extra que hoy no hace falta. **Habría que cambiar esa regla, y decidirlo con César.**
- **Es un proyecto de semanas**, más pruebas con dispositivos reales como las del Módulo 1.

**Variantes que se consideraron:**
- **Un puente simple**, que solo reenvía pedidos y cambios de estado entre mesonero y cocina mientras no hay internet. Es lo más chico.
- **Una copia local completa:** Postgres + PowerSync instalados en el equipo, sincronizados con Supabase. Es muy pesado: replicación en las dos direcciones y conflictos entre la base local y la de la nube. No se recomienda.
- **Un celular o tablet Android como servidor** (con apps tipo Termux). Es frágil: el sistema cierra las apps en segundo plano y es difícil de mantener.

**Si se retoma:** primero hacer una **prueba de concepto chica** con un solo equipo, para confirmar que el certificado y el DNS local funcionan en una red real, antes de construir todo.

### Opción 3: conexión directa entre dispositivos (WebRTC)
Que los dispositivos se conecten entre sí **mientras hay internet** y mantengan esa conexión abierta cuando se cae.
- ❌ Si una tablet se **recarga, se bloquea o apaga la pantalla**, la conexión se pierde y **no se puede volver a armar sin internet**, porque la señalización necesita el servidor.
- ❌ También sería una segunda forma de sincronizar al lado de PowerSync, con riesgo de pedidos duplicados o en conflicto.
- ❌ Poco confiable para un servicio real. **No se recomienda.**

## Recomendación al momento de anotarlo
- **Ahora (piloto y MVP):** la opción 1. Pedirle a Roof **datos móviles en la tablet de cocina** o un router con respaldo 4G.
- **Más adelante**, solo si los restaurantes se quedan sin internet seguido y **sin señal de datos:** la opción 2, empezando por la prueba de concepto y decidiéndolo con César, porque cambia una regla de `CLAUDE.md`.
- **La opción 3 se descarta** por poco confiable.

## Relacionado
- `docs/Pruebas_Offline_Fase8.md`: el comportamiento actual sin internet y la recomendación de datos móviles para cocina.
- `docs/Plan_Piloto_Roof.md`: preparación del piloto.
- `CLAUDE.md`: las reglas "sin hardware propietario" y "mesoneros, cocina y mesas deben seguir funcionando sin internet".
