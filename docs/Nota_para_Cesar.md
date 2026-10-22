# Nota para César — qué hacer con la Fase 5

De: Pedro (con Claude Code). Fecha: 2026-10-22.
PR: https://github.com/Bboyjoker15/BetaRestaurant/pull/1 (rama `feature/fase5-alertas` → `main`).

## Resumen en una línea

La **Fase 5 (Gerencia y reportes) está completa**. Todo está en la rama `feature/fase5-alertas`. Hay que fusionarla en `main`. **No hay que correr nada en Supabase**: las migraciones ya están aplicadas.

---

## Lo que tienes que hacer

### 1. Fusionar el PR
- Abre el PR #1 y dale **Merge** hacia `main`.
- No debería haber conflictos: la rama sale del `main` actual (`e820a2c`) y `main` no ha cambiado desde entonces.
- Si para cuando lo fusiones ya subiste algo nuevo a `main` y hay conflictos, mira la sección "Archivos compartidos que se tocaron" más abajo.

Después del merge, en tu máquina:

```bash
git checkout main
git pull
npm install   # no cambiaron dependencias, pero por si acaso
```

### 2. Base de datos: no hay que hacer nada
Pedro ya aplicó las tres migraciones nuevas en Supabase por el SQL Editor y las probó:

| Migración | Qué agrega |
|---|---|
| `0018_reporte_diario.sql` | `reporte_diario` y `reporte_diario_historial` |
| `0019_kpis_sedes.sql` | `kpis_sedes`, para comparar sedes |
| `0020_alertas_gerencia.sql` | `alertas_gerencia`, las 6 alertas |

**No las vuelvas a correr** ni uses `supabase db push` sin antes registrarlas como aplicadas (`supabase migration repair --status applied 0018`, igual con `0019` y `0020`). Es el mismo problema que ya tenemos con las migraciones anteriores que se aplicaron por el SQL Editor.

### 3. Datos demo (ya cargados, solo para que sepas)
En la base de pruebas ya están cargados `supabase/seeds/demo_segunda_sede.sql` y `demo_recetas.sql`. Por eso vas a ver una segunda sede, **"Demo · Sede Norte"**, y 30 días de ventas inventadas en las dos sedes.
- Para quitarlos: `supabase/seeds/demo_segunda_sede_borrar.sql` en el SQL Editor.
- **Nunca** se corren en la base de un restaurante real.

### 4. Probarlo rápido (opcional)
- **Gerente:** en `/gerencia` aparecen el selector de sede arriba y tres secciones nuevas en la barra lateral: **Reporte por día**, **Sedes** y **Alertas**, esta última con un contador rojo.
- **Supervisor** (`supervisor@prueba.com`): pestaña **"Reporte del día"** en su barra. Solo muestra el día de hoy de su sede.

---

## Qué se construyó (el detalle está en `docs/Registro_de_Cambios.md`)

- **Módulo 2, Reporte por día** (antes "reportes por turno"):
  - No hay turnos: el reporte es por día.
  - El supervisor ve solo hoy y su sede, sin costos.
  - Gerencia ve cualquier día y el historial.
  - Administración no ve estos reportes.
  - Incluye las anulaciones del día.
- **Módulo 3, Vista multi-sede:**
  - Selector "Todas las sedes" / una sede en todo el panel de gerencia.
  - Página para comparar las sedes.
  - Cada sede usa el costo de sus propias compras.
- **Módulo 4, Alertas:**
  - Seis alertas con umbrales fijos: merma alta, anulación de platos ya preparados, faltante en conteo físico, plato con margen negativo, ventas caídas y stock bajo mínimo.
  - Solo las ve gerencia y solo se muestran (no hay "marcar como revisada").

Todas las decisiones de producto las tomó Pedro y están anotadas en `arquitectura.md` (§4.4 y §4.10) y en el Roadmap.

## Archivos compartidos que se tocaron

Si estás trabajando en alguno de estos, revisa el diff al fusionar:

- `src/App.tsx`: rutas nuevas `/mesoneros/reporte`, `/gerencia/reportes`, `/gerencia/sedes` y `/gerencia/alertas`.
- `src/views/components/layout/PanelSidebar.tsx`: cada enlace acepta un `contador` opcional (número rojo a la derecha). Si no lo pasas, todo se ve igual que antes.
- `src/views/components/ui/constants.ts`: nuevo `ETIQUETA_METODO_PAGO`, compartido.
- `src/views/modules/mesoneros/components/BarraMesonero.tsx`: la pestaña "Reporte del día" se agrega solo para supervisor y gerencia.
- `src/models/services/kpisService.ts`: `fetchRecetaCosteada` y `fetchInsumosSinCompra` aceptan un `sedeId` opcional. Si no lo pasas, se comportan igual que antes.
- `src/models/types/kpis.ts` e `index.ts`: tipos nuevos (`ReporteDiario`, `ComparacionSede`, `AlertaGerencia`, etc.).

Lo demás son archivos nuevos o de `gerencia/`.

## Pendientes conocidos (nada bloquea)

- **Seguridad, para revisar más adelante:** la RLS de `pagos_cierre` deja que cualquier usuario de una sede, también un mesonero o cocina, lea los pagos crudos de su sede si consulta la API directamente. Las pantallas y las funciones nuevas sí están protegidas. Cerrarlo implica cambiar esa política sin romper el cierre de cuenta.
- **Alerta de merma:** la regla "+50% sobre el promedio" también salta con montos chicos. Con los datos demo, la Sede Norte da alerta por $12.64. Se podría agregar un monto mínimo semanal si molesta.
- **Fase 2, Módulo 4** (prueba real de sincronización offline): sigue sin hacer. Es una prueba en navegador real que Pedro quiere hacer contigo.

## Lo que sigue en el Roadmap

Con la Fase 5 cerrada, lo siguiente es la **Fase 6, Inteligencia artificial**. El Módulo 1 es la capa adaptadora del proveedor de IA (empezar con Gemini por su nivel gratuito). Regla del proyecto: ninguna sugerencia de la IA se ejecuta sola, siempre la aprueba una persona.
