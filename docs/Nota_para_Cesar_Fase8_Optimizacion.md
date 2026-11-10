# Nota para César — optimización (Fase 8, Módulo 3)

De: Pedro (con Claude Code). Fecha: 2026-11-09. Rama: `feature/fase8-optimizacion`.

## ⚠️ Decisión importante: cada dispositivo guarda solo 2 días de historial

**Decisión de Pedro (2026-11-09):** las tablets y celulares de mesonero y cocina guardan **solo lo de su sede y solo lo reciente**: las cuentas abiertas y lo de los **últimos 2 días**. **Actualización 2026-11-10: lo construimos Pedro y Claude Code** (rama `feature/fase8-historial-2-dias`):
- la migración `0043_archivar_historial.sql`, probada en una base local con todas las migraciones;
- las reglas nuevas, en `docs/Supabase_PowerSync_Setup_Comandos.md`.

Primero se aplica la migración y después las reglas en el panel de PowerSync. Abajo queda la explicación original del porqué.

### Por qué
Hoy las reglas de sincronización de PowerSync (`docs/Supabase_PowerSync_Setup_Comandos.md`, `bucket_definitions`) mandan a **cada dispositivo todo el historial de todas las sedes**: todos los `pedidos_items` y `sesiones_mesa` desde el primer día. Con pocos datos no se nota. Con unos meses de uso:
- la primera sincronización de una tablet nueva (o después de "Reiniciar datos de este dispositivo") pasaría de segundos a minutos;
- la base local crece sin límite en equipos con poca memoria;
- las consultas en vivo de cocina y mesas se vuelven más lentas.

Mesonero y cocina trabajan con las cuentas abiertas de hoy. El historial lo consultan gerencia y los reportes **directo al servidor**, así que no se ven afectados.

### El problema técnico: PowerSync no entiende "hace 2 días"
Las reglas de sincronización **no pueden usar `now()`**: PowerSync evalúa cada fila solo cuando la fila cambia, no a medida que pasa el tiempo. Una regla como `where cerrada_en > now() - interval '2 days'` no existe. La forma estándar de resolverlo:

1. **Migración nueva:**
   - una columna en `sesiones_mesa` y otra en `pedidos_items` (al construirlo se usaron fechas, `archivada_en`/`archivado_en`, en vez de booleanos: nulo = se sincroniza; así el filtro de PowerSync es un simple `is null`), con su índice;
   - una función que marque como archivadas las sesiones **cerradas** con `cerrada_en` de hace más de 2 días, y sus platos. Una sesión **abierta nunca se archiva**, tenga la edad que tenga;
   - programarla con **pg_cron** en Supabase, una vez al día (por ejemplo a las 4 a. m., cuando no hay servicio).
2. **Cambiar las reglas en el panel de PowerSync**: agregar `and archivada_en is null` (o `archivado_en is null`) a las consultas de esas dos tablas. Cuando una fila pasa a archivada, PowerSync **la borra sola** de los dispositivos.
3. **Revisar los triggers de `pedidos_items` antes de marcar `archivado`.** Hay varios (descuento de inventario, validación de anulaciones, fusión de sesiones). **Revisado:** todos solo actúan si cambia el estado, el mesonero o `fusionada_en`, así que archivar no dispara ninguno.
4. **Actualizar `docs/Supabase_PowerSync_Setup_Comandos.md`** con las reglas nuevas.

### "Solo su sede"
Se puede hacer en la misma pasada, con dos buckets:
- un bucket por sede, para usuarios con `sede_id`;
- uno por restaurante completo, para quienes no tienen sede (gerencia de cadena, que también entra a `/mesoneros` y `/cocina`).

Si un usuario cambia de sede, su dispositivo vuelve a sincronizar solo. Pedro aprobó la idea junto con lo de los 2 días; falta definir los detalles al construirlo.

### Por qué no se hizo ya
Toca la base del funcionamiento sin internet: las reglas de PowerSync, una migración y un trabajo programado. Conviene hacerlo con calma y **probarlo con dispositivos reales**, igual que la prueba offline del Módulo 1. Pedro quiso dejarlo anotado para que lo vean juntos.

---

## Lo que sí quedó hecho en esta rama (para que lo sepas al combinar)

- **Lo que se guarda para funcionar sin internet bajó de 9,8 MB a 4,0 MB** (`vite.config.ts`, `globIgnores`). PowerSync guarda la base en IndexedDB (`IDBBatchAtomicVFS`, su valor por defecto) y con eso solo carga `wa-sqlite-async`. Se dejaron de guardar las variantes `mc-` (bases cifradas), la `wa-sqlite` simple (OPFS) y el visor 3D. **Si algún día se configura `encryptionKey` o un vfs OPFS en `powerSyncClient.ts`, hay que sacarlas de esa lista**, o la app no abre sin internet.
- **Cada pantalla se carga aparte** (`lazy()` en `App.tsx`; solo el login va en el paquete principal, que bajó de 987 KB a 257 KB). **Si agregas una pantalla nueva, impórtala con `lazy()` igual que las demás.**
- **`useEstadoConexion`** es un solo estado compartido, con un solo temporizador para toda la app.
- **`usePowerSyncWatch`** no redibuja si el resultado de la consulta no cambió.
- **Índices en la base local** (`powerSyncClient.ts`): por sede, mesa, sesión, mesonero y estado, en las tablas que leen mesonero y cocina. PowerSync los crea solo al abrir la app; no hace falta migración.
- El bug de `docs/BUGS.txt` ya no existía: venía de los datos de ejemplo que se borraron en `2a62b20`.
