# Pendiente: proteger el QR de las mesas

Anotado por Pedro con Claude Code el **2026-11-14**. **Sin decidir:** Pedro lo va a conversar con el restaurante antes de elegir una opción. No se construyó nada.

## El problema
El QR de cada mesa lleva siempre el mismo enlace (`/autopedido/<id de la mesa>`), y así se decidió en la Fase 3. Quien lo escanee una vez puede guardar el enlace y usarlo después **desde cualquier lugar**, por ejemplo desde su casa. Hoy, cuando alguien abre el enlace de una **mesa libre** y pide (función `enviar_pedido_autopedido`, migración `0007`):
- se abre una cuenta y **la mesa queda marcada como "ocupada"** en el mapa del mesonero;
- su pedido queda "por aprobar", pero **no hay botón para rechazarlo**, solo para aprobar.

Así, alguien podría ocupar mesas o mandar pedidos falsos desde fuera del restaurante, una y otra vez.

**Lo que hay que tener claro:** un QR impreso no puede cambiar solo, porque es un papel. Si se quiere algo "nuevo en cada visita", o el QR aparece en una pantalla, o el QR impreso se queda fijo y se pide algo más que sí cambie.

## Las opciones

### 1. QR impreso + código de mesa que cambia en cada visita *(la recomendada)*
- El QR impreso sigue igual, y cualquiera puede **ver el menú**.
- Para **enviar un pedido**, el cliente pone un **código de 4 dígitos** que le da el mesonero. El mesonero lo ve en el panel de esa mesa en su app.
- **El código cambia solo cada vez que se cierra la cuenta.** Lo hace la base de datos al cobrar, por ejemplo con un código guardado en `mesas` que un trigger renueva al cerrar la sesión. El código viejo deja de servir.
- **Desde fuera, alguien puede mirar el menú, pero no pedir ni ocupar la mesa.**
- **Funciona sin internet del lado del mesonero:** el código se renueva al cobrar, y cobrar ya necesita internet, así que su app siempre tiene el vigente en la copia local de `mesas`.
- **Lo que se pierde:** el cliente ya no puede abrir una mesa libre y pedir solo antes de que llegue el mesonero. Cambia la decisión de la Fase 3 que permite abrir una mesa por QR.

### 2. QR que aparece en el celular del mesonero
- No hay QR impreso. Al abrir la mesa, el mesonero muestra en su app un QR nuevo para que lo escaneen, y deja de servir al cerrar la cuenta.
- **Es la opción más segura.**
- **Lo que se pierde:** el mesonero tiene que ir a cada mesa a mostrar su teléfono, y la hoja imprimible de QR (Administración → Mesas, construida el 2026-11-13) deja de usarse.

### 3. QR impreso fijo, con protecciones pero sin código
- Un pedido por QR **no ocupa la mesa** hasta que el mesonero lo aprueba.
- Se agrega un botón **"Rechazar"** en las solicitudes por aprobar.
- Las solicitudes sin aprobar **se borran solas** a los 15 minutos.
- El cliente sigue pudiendo pedir solo, sin esperar a nadie.
- **Lo que queda abierto:** un bromista ya no ocupa mesas, pero sí puede mandar solicitudes falsas que el mesonero tiene que rechazar.

### 4. Combinación: la 1 + las protecciones de la 3
El código por visita, y además el botón "Rechazar" y el borrado automático, para cubrir cualquier caso raro.

## Para cuando se decida
- Las opciones 1, 2 y 4 cambian una decisión de la Fase 3 (`arquitectura.md` §4.1): hay que anotarla ahí y en el Roadmap.
- Cualquier opción necesita una migración que cambie `enviar_pedido_autopedido`. Hay que dar también la consulta para confirmar que lo desplegado en Supabase es igual al archivo.
- Conviene probarlo con dispositivos reales (cliente con datos móviles y mesonero sin internet), como en la prueba del Módulo 1.
