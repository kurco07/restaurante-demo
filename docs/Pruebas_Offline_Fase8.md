# Pruebas reales de offline (Fase 8, Módulo 1)

Protocolo para probar, con dispositivos reales, que **ningún pedido se pierde ni se duplica** cuando se cae el internet del restaurante. Se prueba con mesonero, cocina y cliente por QR a la vez.

Al terminar, se corre `supabase/diagnostico/verificar_offline.sql` en el SQL Editor para confirmar lo que pasó en la base.

---

## Antes de empezar: qué esperar (importante)

- **Sin internet, cada dispositivo sigue funcionando solo, con su copia local. Pero no se ven entre ellos.** Todo pasa por el servidor, así que los pedidos que el mesonero envía sin internet **le llegan a cocina recién cuando vuelve la conexión**, en el dispositivo del mesonero o en el de cocina, el que vuelva primero. Esto **no es una falla**: así está diseñado (PowerSync sincroniza a través de Supabase, no entre dispositivos de la misma red).
  - Si el restaurante necesita que cocina reciba pedidos aunque se caiga el internet, la opción práctica es que **la tablet de cocina tenga datos móviles** de respaldo.
- **Cobrar necesita internet.** Fue decisión de Pedro (2026-10-30). Sin conexión, la ventana de cobro lo avisa y deja **marcar la mesa "por cobrar"**. La mesa queda con una **$** roja en el mapa y aparece un aviso cuando vuelve la conexión.
- **Dos cuentas abiertas en la misma mesa** (dos mesoneros sin internet, o mesonero sin internet y cliente por QR) **se fusionan solas** al volver la conexión (migración `0031`). La segunda se cierra como "fusionada" y sus platos pasan a la primera.
- El indicador de la barra dice **"Sin conexión · N por subir"**: son los cambios guardados en ese dispositivo que todavía no llegaron al servidor. Con conexión tiene que bajar a 0 y decir **"En línea"**.

## Preparación

| Dispositivo | Quién | Usuario | Red |
|---|---|---|---|
| A | Mesonero 1 | `mesonero@prueba.com` | Wi-Fi del restaurante |
| B | Cocina | `cocina@prueba.com` | Wi-Fi del restaurante |
| C | Cliente | (sin cuenta, escanea el QR) | **Datos móviles**, no el Wi-Fi |
| D (opcional) | Mesonero 2 o supervisor | `supervisor@prueba.com` | Wi-Fi del restaurante |

1. Abre la app con internet en A, B y D, inicia sesión y espera a que diga **"En línea"**. Si está instalada como app (PWA), mejor.
2. Recorre las pantallas una vez (mapa, menú, tablero) para que todo quede guardado en el dispositivo.
3. **Anota la hora de inicio.** La pide el script de verificación.
4. Elige 3 mesas libres para la prueba (por ejemplo 1, 2 y 3) y ten a mano la hoja de anotación del final.

**Cómo cortar el internet:** apaga el router o desconecta su cable de internet. Así el Wi-Fi sigue encendido pero sin salida, que es el caso real. Si no se puede, pon A, B y D en **modo avión**. El celular del cliente (C) sigue con datos móviles.

---

## Escenarios

Marca cada uno con ✅ o ❌ y anota lo que viste.

### 1. Pedido sin internet
1. Corta el internet.
2. En **A**, abre la **mesa 1**, agrega 3 platos y **envíalos a cocina**.
3. **Esperado:** A deja hacerlo sin errores, el indicador dice "Sin conexión · N por subir" y los platos se ven en "Mis pedidos". **B no los ve todavía** (ver arriba).

### 2. Recargar la página sin internet
1. Con el internet todavía cortado, **recarga** la app en A y en B (o ciérrala y ábrela).
2. **Esperado:** no manda al login, se ve el perfil y lo que había (mesas, pedidos, tablero).

### 3. Cocina sin internet
1. En **B**, marca como "en preparación" o "listo" algún pedido que ya tenía de antes del corte.
2. **Esperado:** deja hacerlo, y el contador "por subir" de B sube.

### 4. Volver la conexión
1. **Vuelve a conectar** el internet.
2. **Esperado, en menos de un minuto:**
   - A y B dicen "En línea" y su contador baja a 0;
   - **B ve los 3 platos de la mesa 1**, una sola vez cada uno;
   - A ve los cambios de estado que hizo B.

### 5. Misma mesa en dos dispositivos sin internet (necesita D)
1. Corta el internet.
2. En **A** abre la **mesa 2** y agrega 2 platos. En **D** abre también la **mesa 2** y agrega 1 plato distinto.
3. Vuelve a conectar.
4. **Esperado:** la mesa 2 queda con **una sola cuenta, de 3 platos**. En el mapa no aparece duplicada. Al cobrarla salen los 3.

### 6. Cliente por QR mientras el mesonero está sin internet
1. Corta el internet (C sigue con datos móviles).
2. En **C**, escanea el QR de la **mesa 3** y pide 2 platos.
3. En **A**, abre la **mesa 3** y agrega 1 plato.
4. Vuelve a conectar.
5. **Esperado:** la mesa 3 queda con **una sola cuenta, de 3 platos** (2 del QR y 1 del mesonero), asignada al mesonero. Los del QR que necesitan aprobación aparecen para aprobar como siempre.

### 7. Intentar cobrar sin internet
1. Corta el internet. En **A**, abre el cobro de una mesa con todo listo.
2. **Esperado:** sale el aviso "Sin conexión: el cobro se registra cuando vuelva internet" y el botón no deja cobrar. Toca **"Marcar para cobrar cuando vuelva internet"**: la mesa queda con una **$** roja en el mapa.
3. Vuelve a conectar. **Esperado:** el mapa avisa "Ya hay conexión: queda 1 mesa por cobrar". Cóbrala y la **$** desaparece.

### 8. Envío doble o conexión intermitente
1. Con la conexión cortándose y volviendo (prende y apaga el router un par de veces), en **A** agrega y envía platos a la **mesa 1**. Toca "Enviar" rápido dos veces.
2. **Esperado:** cada plato aparece **una sola vez** en cocina y en la cuenta.

### 9. (Opcional) Sin internet por un turno
1. Deja el internet cortado 1 o 2 horas mientras se usan A y B con normalidad.
2. **Esperado:** todo funciona, y al volver sube todo sin perder ni duplicar nada.

---

## Al terminar

1. Abre `supabase/diagnostico/verificar_offline.sql` en el SQL Editor, cambia la hora de inicio y corre cada bloque por separado (selecciónalo y "Run selected"):
   - **Bloque 1** (mesas con dos cuentas abiertas): **vacío**.
   - **Bloque 2** (fusionadas): deberían aparecer las de los escenarios 5 y 6.
   - **Bloque 3** (platos en cuentas fusionadas): **vacío**.
   - **Bloque 4** (posibles duplicados): **vacío**, o revisar uno por uno.
   - **Bloque 5** (resumen por mesa y persona): tiene que **coincidir con la hoja de abajo**.
2. Anota los resultados en `docs/Registro_de_Cambios.md` y, si todo está bien, marca el Módulo 1 de la Fase 8 con ✅.

## Hoja de anotación

| Escenario | Mesa | Quién | Platos cargados | ✅ / ❌ | Notas |
|---|---|---|---|---|---|
| 1 | 1 | Mesonero 1 | | | |
| 3 | — | Cocina | (estados cambiados) | | |
| 5 | 2 | Mesonero 1 | | | |
| 5 | 2 | Mesonero 2 | | | |
| 6 | 3 | Cliente QR | | | |
| 6 | 3 | Mesonero 1 | | | |
| 7 | | Mesonero 1 | (cobro) | | |
| 8 | 1 | Mesonero 1 | | | |
