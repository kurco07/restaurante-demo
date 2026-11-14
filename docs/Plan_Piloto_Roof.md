# Plan del piloto beta: Roof (Fase 8, Módulo 4)

Decidido por Pedro con Claude Code el **2026-11-13**. Es la guía para preparar y correr el piloto. Lo que todavía no está decidido aparece como **"Falta"**.

## Qué es el piloto
La primera vez que la app se usa en un restaurante real, en servicio normal. Sirve para validar que lo central funciona (ningún pedido perdido o duplicado, inventario que cuadra) y para juntar la opinión de usuarios reales antes de pulir el diseño en la Fase 9.

Referencias:
- `Roadmap_Construccion_MVP.md`, Fase 8, Módulo 4;
- `Estrategia_Comercial_Ejecutiva.md`, secciones 5 y 6: 10 a 20 restaurantes piloto, 14 días de seguimiento humano activo y onboarding con acompañamiento.

Se usa con la interfaz actual: funcional pero básica. **Hay que decírselo claramente al restaurante.**

## Decisiones
| Tema | Decisión |
|---|---|
| Restaurante | **Roof, una sede.** Su menú real ya está en `docs/Menu.md`. Se suman sedes y restaurantes cuando funcione bien. |
| Carga de datos | **La hacen Pedro y César:** menú, recetas, mesas y usuarios. El restaurante solo revisa. |
| QR de las mesas | **Hoja imprimible desde la app** (Administración → Mesas): el QR de cada mesa, listo para imprimir. Hay que construirla. |
| Capacitación | **Una sesión práctica antes de empezar + una guía de 1 página por rol** (mesonero, cocina, administración). |
| Soporte en servicio | **WhatsApp directo a Pedro o César**, con un botón **"Ayuda"** en la app que abre ese chat. Duración: los 14 días del piloto. |
| Cómo se mide | Las cuatro cosas de abajo. |

## Cómo se mide si salió bien
1. **Pedidos sin errores:** ningún pedido perdido ni duplicado, y todo lo pedido se cobró. Se revisa con consultas de solo lectura (como `supabase/diagnostico/verificar_offline.sql`).
2. **Inventario que cuadra:** al final del piloto, el inventario que calcula la app contra un **conteo físico real** (Administración → Conteo físico).
3. **Uso real de la app:** pedidos por QR contra pedidos por mesonero, mesas atendidas por día, y si el personal la usa todo el turno.
4. **Opinión del dueño y del personal:** una encuesta corta al final, con qué les gustó, qué les molestó y si pagarían por la app.

## Qué hay que preparar
### Para construir
- [x] Hoja imprimible de QR por mesa: Administración → Mesas → **"Imprimir QR de las mesas"** (`/administracion/mesas/qr`). Construida el 2026-11-13, **falta que Pedro la pruebe**.
- [x] Botón **"Ayuda"** que abre el WhatsApp de soporte: en las barras de mesonero y cocina y en la barra lateral de administración y gerencia. Los contactos están en `src/lib/soporte.ts`: hoy Pedro (+58 424 9527732) y César (+58 412 0884122). Más adelante puede cambiar, por ejemplo a la jefa del equipo; basta con editar esa lista.
- [ ] Consultas de medición del piloto, de solo lectura (puntos 1 y 3 de arriba).

### Para escribir
- [ ] Guía de 1 página para el mesonero.
- [ ] Guía de 1 página para cocina.
- [ ] Guía de 1 página para administración.
- [ ] Lista de pasos para dejar listo el restaurante (onboarding).
- [ ] Encuesta final para el dueño y el personal.

### Para hacer con el restaurante
- [ ] Crear el restaurante de Roof en la plataforma y cargar su menú, recetas, mesas y personal.
- [ ] Imprimir y poner los QR.
- [ ] Sesión de capacitación.
- [ ] Inventario inicial: un conteo físico el día que arranca, para tener contra qué comparar al final.
- [ ] Explicarle a Roof qué es el piloto y que la interfaz es básica.
- [ ] Pedirle a Roof **internet de respaldo para cocina** (datos móviles en la tablet o un router con 4G). Sin internet, mesonero y cocina no se ven entre ellos hasta que vuelve la conexión; ver `docs/Pendiente_Conexion_Local_Sin_Internet.md`.

## Falta
- ~~Número de WhatsApp de soporte~~: los dos, Pedro y César (2026-11-13).
- **Qué sede de Roof**, cuántas mesas tiene y quiénes del personal van a usar la app (nombres y roles).
- **Fecha de inicio** de los 14 días.
- **Proteger el QR de las mesas** para que nadie pida ni ocupe una mesa desde fuera del restaurante. Pedro lo va a hablar con Roof; las opciones están en `docs/Pendiente_QR_Seguro.md`.
- **Quién va a la sesión de capacitación** y si alguien acompaña el primer servicio.
