# Flujo de colaboración (2 desarrolladores)

Trabajamos en paralelo dividiendo por **módulo del roadmap** (`docs/Roadmap_Construccion_MVP.md`), no por capas. Cada módulo vive en su propia rama y, en la mayoría de los casos, en su propia carpeta de `src/modules/`, así que el riesgo de pisarnos es bajo si seguimos esto.

## Ramas activas

| Rama | Módulo | Responsable |
|---|---|---|
| `feature/fase2-menu-recetas` | Fase 2, Módulo 1 — Menú y recetas | Cesar |
| `feature/fase2-mapeo-mesas` | Fase 2, Módulo 2 — Mapeo de mesas | Compañero |

Estos dos módulos no dependen entre sí — se pueden construir al mismo tiempo. Los siguientes módulos de la Fase 2 (toma de pedidos, sincronización, cocina, cierre de cuenta) sí dependen de estos dos, así que no se arrancan hasta que ambos estén mergeados a `main`.

## Reglas básicas

1. **Nunca se trabaja directo sobre `main`.** Cada módulo = una rama `feature/faseN-nombre-modulo`.
2. **Commits chicos y frecuentes**, `git push` seguido a tu rama en `origin`.
3. **Antes de empezar cada sesión**: `git checkout main && git pull`, y luego `git merge main` (o rebase) sobre tu rama, para no divergir mucho.
4. **PR a `main` cuando el módulo esté funcionando** (no hace falta que esté 100% terminado — mejor mergear seguido que acumular una rama gigante). El otro dev revisa antes de mergear.
5. Al terminar y verificar un módulo, márcalo ✅ en `docs/Roadmap_Construccion_MVP.md` **solo el que lo construyó y lo probó él mismo**.

## Zona de cuidado — archivos compartidos

Estos archivos los vamos a tocar los dos tarde o temprano. Antes de editarlos, avísale al otro por chat (aunque sea "voy a agregar tal cosa a X archivo"):

- **`supabase/migrations/`** — nunca se edita un archivo ya aplicado. Si tu módulo necesita cambios de esquema, crea un archivo nuevo (`0002_...sql`, `0003_...sql`, numerado después del último que exista) y avisa antes de correrlo contra el Supabase compartido — afecta la base de datos de los dos.
- **`src/lib/powerSyncClient.ts`** — el schema de PowerSync. Si tu módulo necesita una tabla nueva disponible offline, agrégala aquí y avisa (puede generar conflicto de merge si los dos la tocan el mismo día).
- **`src/App.tsx`** — rutas de la app. Cambios normalmente chicos (agregar una ruta), bajo riesgo pero pueden chocar si los dos agregan rutas la misma semana.
- **`src/lib/rolesPorModulo.ts`** y **`src/types/`** — tipos y matriz de roles compartidos.
- **`docs/Roadmap_Construccion_MVP.md`** — al marcar ✅, jala primero `main` para no pisar la marca del otro.

## Migraciones de base de datos — flujo concreto

1. Crea el archivo SQL nuevo en `supabase/migrations/` (numerado, nunca edites uno existente).
2. Avisa al otro dev antes de aplicarlo al proyecto Supabase compartido.
3. Aplícalo (vía SQL Editor del dashboard, ya que la conexión directa por CLI/psql no funciona en esta red).
4. Confirma en el chat del equipo que ya se aplicó, para que el otro haga `pull` de la migración y sepa que el esquema remoto cambió.
