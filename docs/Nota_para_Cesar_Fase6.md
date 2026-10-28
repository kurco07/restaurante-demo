# Nota para César — qué hacer con la Fase 6 (IA)

De: Pedro (con Claude Code). Fecha: 2026-10-28.
PR: rama `feature/fase6-recomendados` → `main`. Este PR reemplaza al PR #2, que solo traía los Módulos 1 y 2.

## Resumen en una línea

La **Fase 6 (Inteligencia artificial) está completa**: los 5 módulos, probados por Pedro con Gemini real. Las migraciones `0021`, `0022` y `0023` **ya están aplicadas**, las 4 Edge Functions **ya están desplegadas** y los secretos ya están puestos. Al fusionar **no hay que correr nada en Supabase**.

---

## Lo que tienes que hacer

### 1. Fusionar el PR
La rama sale del `main` actual (`5b7282f`) y `main` no cambió desde entonces, así que no debería haber conflictos. Después:

```bash
git checkout main
git pull
npm install   # no cambiaron dependencias, por si acaso
```

### 2. Supabase: nada, pero conviene saber qué hay

| Qué | Estado |
|---|---|
| Migraciones `0021_sugerencias_compra`, `0022_platos_a_preparar`, `0023_recomendados_del_dia` | Aplicadas por el SQL Editor. **No las vuelvas a correr**, y antes de usar `db push` regístralas con `supabase migration repair --status applied 0021` (igual con `0022` y `0023`) |
| Edge Functions `ia-probar`, `ia-sugerir-compras`, `ia-sugerir-platos`, `ia-sugerir-recomendados` | Desplegadas |
| Secretos `GEMINI_API_KEY` y `GEMINI_MODELO=gemini-flash-lite-latest` | Puestos en Supabase → Edge Functions → Secrets. **La clave no está en el código ni en el repo** |

**Para redesplegar una función** después de tocarla: `npx supabase functions deploy <nombre> --use-api`. Desde la red de Pedro esto sí funciona; lo que no funciona es la conexión directa a la base, por eso las migraciones van por el SQL Editor.

**Sobre los modelos de Gemini:** con claves nuevas, `gemini-2.5-flash-lite` y `gemini-2.5-flash` dan 404, y `gemini-flash-latest` no respondía. Funciona `gemini-flash-lite-latest`. Si alguna vez falla, **Gerencia → Sugerencias IA → Probar conexión** muestra el motivo y los modelos que la clave sí puede usar. Se arregla cambiando el secreto, no el código.

### 3. Probarlo rápido (opcional)
- **Administración** → Inventario → **Sugerencias IA**: generar, aprobar y ver el borrador en Compras.
- **Gerencia** → **Sugerencias IA**: elegir sede y usar "Platos a preparar hoy" y "Recomendados del día".
- **Cocina** → pestaña **Sugeridos**.
- **Mesonero** → pestaña **Sugeridos**, y la franja ⭐ en el menú.
- **QR de una mesa**: la franja ⭐.

---

## Qué se construyó (detalle en `docs/Registro_de_Cambios.md`)

Regla de toda la fase: **la IA nunca ejecuta nada sola**. Cada sugerencia queda en `sugerencias_ia` como pendiente hasta que una persona la apruebe o la rechace con motivo.

- **Módulo 1, capa de IA:** `supabase/functions/_shared/ia/` tiene la interfaz `ProveedorIA` y el adaptador de Gemini. Cambiar de proveedor = otro adaptador más el secreto `IA_PROVEEDOR`.
- **Módulo 2, compras:** las genera y aprueba **administración**. Al aprobar se crea un **borrador de orden por proveedor** ("IA (sugerida)"), que sigue el paso normal de Compras.
- **Módulo 3, platos a preparar:** los aprueba **gerencia**, por sede. **Cocina** los ve en su pestaña Sugeridos, **sin precios**.
- **Módulo 4, recomendados del día:** los aprueba **gerencia**, que puede editar la frase. Se ven en el menú del mesonero (franja ⭐ y pestaña Sugeridos) y en el QR del cliente, **solo el plato y la frase**.
- **Módulo 5, aprobación:** una sola bandeja para los tres tipos.

**Cálculo mixto en los tres:** la base calcula los números (consumo, stock, ventas, margen, lotes por vencer) y la IA solo elige, ajusta dentro de un margen y explica. El servidor valida todo lo que devuelve la IA y descarta lo inventado o lo que se pasa de rango.

**Datos que se le mandan a la IA:** solo cifras y nombres de insumos o platos, nunca personas. Es una decisión de Pedro, porque el nivel gratuito de Gemini puede usar lo que recibe. Para restaurantes reales en producción hay que pasar a un nivel pago.

## Cambios de seguridad que conviene saber

- **`sugerencias_ia` tiene una política RLS restrictiva** (`0022`): solo administración, gerencia y super-admin la leen o escriben. Antes la leía cualquiera del restaurante, y trae costos.
  - Cocina, mesonero y cliente leen lo suyo por funciones `security definer` que **no devuelven precios**: `platos_sugeridos_hoy`, `recomendados_hoy` y `recomendados_mesa`.
- **Triggers en `sugerencias_ia`:**
  - nace pendiente;
  - se revisa una sola vez;
  - cada tipo lo revisa su rol (compras administración; platos y recomendados gerencia);
  - **no se borra**.
- Las Edge Functions actúan **con la sesión de quien llama** (RLS); **no usan la clave de servicio**.

## Archivos compartidos que se tocaron

Si estás trabajando en alguno, revisa el diff:

- `src/App.tsx`: rutas nuevas `/administracion/sugerencias-compra`, `/gerencia/sugerencias`, `/cocina/sugeridos` y `/mesoneros/sugeridos`.
- `src/views/modules/cocina/CocinaLayout.tsx` y `components/BarraCocina.tsx`: pestaña Sugeridos con contador. El layout pide la lista y la pasa por `Outlet context`.
- `src/views/modules/mesoneros/MesoneroLayout.tsx` y `components/BarraMesonero.tsx`: lo mismo para el mesonero. **`MesoneroLayout` ahora pasa `context` al `Outlet`**: si alguna página tuya usa `useOutletContext` ahí, ojo.
- `src/views/modules/pedidos/PedidosPage.tsx`: franja ⭐ arriba del buscador, y abre un plato si llega `location.state.abrirPlato`.
- `src/controllers/pedido/usePedidos.ts`: ahora también devuelve `platos` (todos los de la sede).
- `src/views/modules/autopedido/AutopedidoPage.tsx`: franja ⭐ arriba de la lista.
- `src/views/modules/administracion/components/InventarioTabs.tsx`: pestaña "Sugerencias IA".
- `src/views/modules/gerencia/components/GerenciaSidebar.tsx`: enlace "Sugerencias IA".

## Pendientes conocidos (nada bloquea)

- **Fotos reales de los platos:** hoy ningún plato tiene foto (`imagen_url` solo elige un fondo de color) y no hay forma de subirlas. Los recomendados y la RA lo necesitan. Está anotado en el Roadmap (Fase 7) como pendiente sin fase decidida.
- **Copia local de PowerSync trabada:** en una prueba, el navegador de Pedro no aplicaba un cambio de `usuarios`, aunque cerrara sesión y recargara. El servidor y el stream estaban bien. Se arregló borrando los datos del sitio. Conviene vigilarlo en mesonero y cocina (el detalle está en el registro de cambios del Módulo 2).
- **Supervisor:** algunas funciones de datos con costos (`datos_sugerencia_compra`, `kpis_rentabilidad`) siguen siendo llamables por cualquier rol del restaurante si consulta la API directamente. Las de la Fase 6 nuevas sí devuelven vacío a quien no es de gestión.

## Lo que sigue en el Roadmap

**Fase 7: multi-tenant real, negocio y personalización.** Su Módulo 1 es el registro self-service de un restaurante nuevo. También queda pendiente la **prueba offline de cocina** (Fase 2, Módulo 4), que solo se confirmó con mesonero.
