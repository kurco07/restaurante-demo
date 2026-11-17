# Cuentas de prueba

Del restaurante de prueba ("Restaurante Prueba", Sede Principal). Todas usan la contraseña de prueba de siempre, la que conoce el equipo.

Desde el 2026-11-16, **solo administración entra por `/login`**. Los demás roles entran por su **enlace propio** (ver `Registro_de_Cambios.md`, 2026-11-16). Agrega el enlace a la dirección de la app, por ejemplo `https://beta-restaurant-ten.vercel.app/acceso/…`.

| Rol | Cómo entra |
|---|---|
| Administración | `/login` con `administracion@prueba.com` |
| Mesonero ("Prueba mesonero") | `/acceso/4e78d9d7-6d72-4204-9570-b781060dfad6` |
| Cocina ("Prueba cocina") | `/acceso/15f59da5-210b-4edb-a0b9-d5241f466f85` |
| Supervisor ("Prueba supervisor") | `/acceso/3dad69a0-090c-4775-8ce8-35dc84c8ff42` |
| Gerencia ("Prueba gerencia") | `/acceso/ccd55c83-ba30-4163-924d-5448307671cd` |

**Ojo:** una misma cuenta solo puede estar abierta en **un dispositivo a la vez**; al abrirla en otro, el anterior se cierra solo. Para pruebas con varios dispositivos, usa una cuenta distinta en cada uno, por ejemplo mesonero en uno y supervisor en otro.
