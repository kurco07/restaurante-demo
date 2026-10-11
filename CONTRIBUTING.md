# Flujo de colaboración (2 desarrolladores)

Trabajamos en paralelo dividiendo por **módulo del roadmap** (`docs/Roadmap_Construccion_MVP.md`), no por capas. Cada módulo vive en su propia rama y en su propia carpeta de `src/views/modules/`, así que el riesgo de pisarnos es bajo si seguimos esto.

## Reparto completo del roadmap

Fase 1 ya está completa (auth, contexto de usuario/tenant/rol, rutas protegidas, esquema de base de datos y PowerSync — hecho entre los dos como base común). Desde la Fase 2 en adelante, cada módulo tiene un dueño fijo. La columna "Depende de" marca qué tiene que estar mergeado a `main` antes de poder arrancar ese módulo en serio (se puede ir dejando el esqueleto de la pantalla antes, pero no conectarlo de verdad).

Esto es una propuesta de reparto, no una piedra tallada — si alguno prefiere cambiar un módulo por otro, se ajusta la tabla y ya.

### Fase 2 — Núcleo operativo: menú, mesoneros y cocina

| Módulo | Responsable | Depende de | Rama |
|---|---|---|---|
| 1. Menú y recetas | **Cesar** | Fase 1 | `feature/fase2-menu-recetas` |
| 2. Mapeo de mesas | **Compañero** | Fase 1 | `feature/fase2-mapeo-mesas` |
| 3. Toma de pedidos del mesonero (offline) | **Cesar** | Mód. 1 y 2 | `feature/fase2-toma-pedidos` |
| 4. Sincronización de comandas (pruebas dirigidas) | **Cesar** | Mód. 3 | (misma rama del Mód. 3, o una de pruebas aparte) |
| 5. Cocina — pantalla en tiempo real | **Compañero** | Mód. 3 (necesita pedidos reales fluyendo) | `feature/fase2-cocina-tiempo-real` |
| 6. Cierre de cuenta por mesa | **Compañero** | Mód. 3 | `feature/fase2-cierre-cuenta` |

Los módulos 1 y 2 son el punto de partida — no dependen entre sí, van en paralelo ahora mismo. Todo lo demás de la Fase 2 espera a que esos dos estén mergeados a `main`.

### Fase 3 — Autopedido del cliente por QR

| Módulo | Responsable | Depende de |
|---|---|---|
| 1. Página pública de menú por mesa | **Cesar** | Fase 2 Mód. 1 |
| 2. Función segura de autopedido (RPC/Edge Function) | **Compañero** | Fase 3 Mód. 1 |
| 3. Sesión de mesa compartida (mesonero + cliente en tiempo real) | **Cesar** | Fase 3 Mód. 1-2, Fase 2 Mód. 3 |

### Fase 4 — Administración e inventario completos

**Reparto ajustado (2026-10-11):** esta fase completa queda con **Cesar**, no dividida por módulo como las anteriores — Pedro se enfoca en la Fase 5 completa mientras tanto.

| Módulo | Responsable | Depende de |
|---|---|---|
| 1. Gestión de insumos | **Cesar** | Fase 2 Mód. 1 (recetas) |
| 2. Descuento automático de inventario | **Cesar** | Fase 4 Mód. 1, Fase 2 Mód. 3 |
| 3. Lotes de insumo | **Cesar** | Fase 4 Mód. 1 |
| 4. Movimientos de inventario | **Cesar** | Fase 4 Mód. 1-3 |
| 5. Proveedores y órdenes de compra | **Cesar** | Fase 4 Mód. 1 |

### Fase 5 — Gerencia y reportes

**Reparto ajustado (2026-10-11):** esta fase completa queda con **Pedro**, en paralelo con la Fase 4 de Cesar.

| Módulo | Responsable | Depende de |
|---|---|---|
| 1. Dashboard de KPIs | **Compañero** | Fases 2 y 4 generando datos reales |
| 2. Reportes por turno | **Compañero** | Fase 2 Mód. 6 (cierre de cuenta) |
| 3. Vista multi-sede | **Compañero** | Fase 5 Mód. 1-2 |

### Fase 6 — Inteligencia artificial

| Módulo | Responsable | Depende de |
|---|---|---|
| 1. Capa adaptadora de proveedor de IA (Gemini) | **Compañero** | Fases anteriores generando datos |
| 2. Sugerencias de compra | **Cesar** | Fase 6 Mód. 1 |
| 3. Sugerencias de qué platos preparar | **Compañero** | Fase 6 Mód. 1 |
| 4. Recomendados del día | **Cesar** | Fase 6 Mód. 1 |
| 5. Flujo de aprobación humana (UI aprobar/rechazar en `sugerencias_ia`) | **Ambos** — es una pantalla transversal que sirve a los tres módulos anteriores | Fase 6 Mód. 2-4 |

Fuera de este reparto (no se construyen salvo pedido explícito, ver `CLAUDE.md`): realidad aumentada, asistente de IA conversacional, marketplace de integraciones.

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
- **`src/lib/rolesPorModulo.ts`** y **`src/models/types/`** — tipos y matriz de roles compartidos.
- **`docs/Roadmap_Construccion_MVP.md`** — al marcar ✅, jala primero `main` para no pisar la marca del otro.

## Migraciones de base de datos — flujo concreto

1. Crea el archivo SQL nuevo en `supabase/migrations/` (numerado, nunca edites uno existente).
2. Avisa al otro dev antes de aplicarlo al proyecto Supabase compartido.
3. Aplícalo (vía SQL Editor del dashboard, ya que la conexión directa por CLI/psql no funciona en esta red).
4. Confirma en el chat del equipo que ya se aplicó, para que el otro haga `pull` de la migración y sepa que el esquema remoto cambió.
