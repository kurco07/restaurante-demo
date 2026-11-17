# Encuesta final del piloto

Se hace al terminar los 14 días: una versión para el **dueño o encargado** y otra corta para **cada persona del personal**. Puede ser en papel, en un formulario en línea o conversando. Lo importante es anotar las respuestas tal cual.

Escala de las preguntas de puntaje: **1 = muy mal · 5 = muy bien**.

---

## A. Dueño o encargado

**Uso y confianza**
1. ¿Qué tan fácil fue empezar a usar la app? (1 a 5)
2. ¿Confías en que no se perdió ni se duplicó ningún pedido? (1 a 5) ¿Notaste algún caso? ¿Cuál?
3. ¿El cierre de caja cuadró mejor, igual o peor que antes?
4. ¿El inventario que mostraba la app se parecía a lo que había de verdad? (1 a 5)

**Valor**
5. ¿Qué es lo **más útil** de la app para tu restaurante?
6. ¿Qué es lo que **más te molestó** o te hizo perder tiempo?
7. ¿Usaste los **reportes** (ventas, platos más vendidos, rentabilidad)? ¿Cuáles te sirvieron?
8. ¿Los clientes usaron el **pedido por QR**? ¿Qué comentaron?
9. ¿Tuvieron problemas cuando **se fue el internet**? ¿Qué pasó?

**Decisión**
10. ¿Seguirías usando la app después del piloto? (Sí / No / Tal vez) ¿Por qué?
11. ¿**Pagarías** por ella? ¿Cuánto te parecería justo al mes?
12. ¿Qué tendría que tener, o qué tendría que cambiar, para que la recomiendes a otro restaurante?
13. ¿Qué tal fue el **soporte** por WhatsApp? (1 a 5)

---

## B. Personal (mesonero, supervisor, cocina)

Rol: ☐ Mesonero ☐ Supervisor ☐ Cocina ☐ Otro: ______

1. ¿Qué tan fácil es usar la app en el servicio? (1 a 5)
2. ¿Es más rápido o más lento que como trabajaban antes (papel o de palabra)?
3. ¿Hubo algún momento en que **volviste al papel** o a gritarle a cocina? ¿Por qué?
4. Mesoneros: ¿los pedidos por QR te ayudaron o te complicaron?
5. Cocina: ¿el tablero te deja ver bien qué preparar y en qué orden? ¿Los colores de tiempo te sirven?
6. ¿Qué botón, pantalla o paso cambiarías?
7. ¿Algo falló alguna vez? ¿Qué pasó?
8. ¿Usaste el botón **Ayuda**? ¿Te respondieron rápido?
9. ¿La seguirías usando? (Sí / No / Tal vez)

---

## Cómo se junta con los números
Las respuestas se comparan con lo que mide `supabase/diagnostico/medicion_piloto.sql`:
- **Pregunta A2** ↔ bloques 2 a 6 (cuentas sin cobro, cobros que no coinciden, duplicados, platos atascados).
- **Pregunta A8 y B4** ↔ bloque 7 (porcentaje de pedidos por QR).
- **Pregunta B3** ↔ bloque 9 (huecos de actividad en medio del turno).
- **Pregunta A4** ↔ el conteo físico final comparado con el de inicio.
