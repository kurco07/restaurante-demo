# Lista de pasos: dejar listo un restaurante para el piloto

Para Pedro y César. Se sigue en orden y se marca cada paso. Pensada para Roof (`docs/Plan_Piloto_Roof.md`), pero sirve para cualquier restaurante del piloto.

## 1. Antes de ir (con el dueño, por WhatsApp o llamada)
- [ ] Explicarle **qué es el piloto**: 14 días de uso real con acompañamiento, la interfaz es básica (se pule después) y lo que más importa es su opinión.
- [ ] Confirmar **la sede**, **la fecha de inicio** y **el horario de servicio**.
- [ ] Pedir el **menú vigente**: platos, precios y categorías. Para Roof ya hay una versión en `docs/Menu.md`; confirmar que no cambió.
- [ ] Pedir las **recetas** de los platos (qué insumos y cuánto lleva cada uno), o al menos de los más vendidos.
- [ ] Pedir la **lista del personal** que va a usar la app: nombre y rol (mesonero, supervisor, cocina, gerencia, administración).
- [ ] Preguntar **cuántas mesas** hay y su numeración, y pedir una foto del salón para armar el plano.
- [ ] Pedir **internet de respaldo para cocina** (datos móviles en la tablet o un router con 4G). Ver `docs/Pendiente_Conexion_Local_Sin_Internet.md`.
- [ ] Confirmar **qué dispositivos** se van a usar (celulares de los mesoneros, tablet de cocina, computadora de administración) y que tengan un navegador actualizado (Chrome).
- [ ] Logo y colores del restaurante, si quieren la app con su marca.

## 2. Cargar el restaurante (lo hacemos nosotros)
- [ ] **Crear el restaurante** en la plataforma (registro o super-admin) con su sede.
- [ ] **Menú:** categorías, platos, precios, disponibilidad y recetas.
- [ ] **Insumos** con su unidad y stock mínimo.
- [ ] **Mesas:** el plano con la numeración real.
- [ ] **Personal:** un usuario por persona, con su rol y una contraseña. Anotar cada **enlace de acceso** para entregarlo.
- [ ] **Marca:** logo y colores, si los mandaron.
- [ ] **Probar todo con internet**, de punta a punta: tomar un pedido, que llegue a cocina, avanzarlo, pedir por QR, aprobar y cobrar. Después **anular** esas cuentas de prueba.
- [ ] **Revisar el día anterior** que la app esté publicada con la última versión.

## 3. El día de la capacitación (en el restaurante)
- [ ] **Imprimir los QR** desde la app publicada (Administración → Mesas → "Imprimir QR de las mesas") y ponerlos en las mesas.
- [ ] **Instalar la app** en cada dispositivo (agregar a pantalla de inicio) y entrar con el enlace de cada persona.
- [ ] **Recorrer cada dispositivo una vez con internet** (mapa, menú, tablero), para que quede todo guardado.
- [ ] **Sesión práctica** (unos 30 a 45 minutos), con la guía de cada rol impresa:
  - mesoneros: `docs/piloto/Guia_Mesonero.md`;
  - cocina: `docs/piloto/Guia_Cocina.md`;
  - administración: `docs/piloto/Guia_Administracion.md`.
- [ ] **Simular un servicio corto:** 2 o 3 mesas con pedidos de mentira (incluido uno por QR), avanzarlos en cocina, cobrarlos y anularlos al final.
- [ ] **Probar el botón Ayuda** desde un dispositivo, para que vean que llega el WhatsApp.
- [ ] **Conteo físico inicial del inventario** (Administración → Inventario → Conteo físico). Es la base para comparar al final del piloto.

## 4. Durante los 14 días
- [ ] **Primer servicio acompañado**, si se puede (alguien de nosotros presente).
- [ ] **Una vez por día**, correr `supabase/diagnostico/medicion_piloto.sql` (bloques 1 a 6) y revisar que no haya cuentas sin cobrar, duplicados ni platos atascados.
- [ ] Responder rápido por WhatsApp (botón Ayuda) y **anotar cada problema o pedido** del personal.
- [ ] **Mitad del piloto (día 7):** conversación corta con el dueño sobre cómo va.

## 5. Al terminar
- [ ] **Conteo físico final** y comparar con lo que calculó la app.
- [ ] Correr **todos los bloques** de `medicion_piloto.sql` (uso real: QR contra mesonero, mesas por día, actividad por turno, anulaciones).
- [ ] **Encuesta final** al dueño y al personal: `docs/piloto/Encuesta_Final.md`.
- [ ] Anotar resultados y aprendizajes en `docs/Registro_de_Cambios.md` y decidir los siguientes pasos.
