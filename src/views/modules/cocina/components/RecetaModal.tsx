import { usePowerSyncWatch } from '../../../../controllers/usePowerSyncWatch'

interface IngredienteRow {
  insumoId: string
  nombre: string
  cantidadRequerida: number
  unidad: string
}

interface RecetaModalProps {
  menuItemId: string
  plato: string
  onVolver: () => void
  onCerrar: () => void
}

const SQL = `
  select
    r.insumo_id as insumoId,
    i.nombre as nombre,
    r.cantidad_requerida as cantidadRequerida,
    r.unidad as unidad
  from recetas r
  join insumos i on i.id = r.insumo_id
  where r.menu_item_id = ?
  order by i.nombre
`

// Ficha de la receta BASE del plato — no del pedido específico que la abrió.
// Los cambios/omisiones de un pedido puntual se ven en el ticket, no acá.
// El indicador de disponible/agotado del boceto se quitó: sin inventario
// real conectado todavía (Fase 4), mostrarlo sería inventar un dato.
export function RecetaModal({ menuItemId, plato, onVolver, onCerrar }: RecetaModalProps) {
  const ingredientes = usePowerSyncWatch<IngredienteRow>(SQL, [menuItemId])

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[22px] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onVolver} className="text-xs font-bold text-gray-500">
            ← Volver al pedido
          </button>
          <button type="button" onClick={onCerrar} className="text-lg text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-5 flex h-[160px] items-center justify-center rounded-2xl bg-orange-500">
          <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.3}>
            <path d="M3 10h18M3 14h18M4 10a8 6 0 0116 0M4 14a1 1 0 001 1h14a1 1 0 001-1" />
          </svg>
        </div>

        <span className="mb-2 inline-block text-xs font-extrabold uppercase tracking-wider text-orange-600">
          Ficha de receta
        </span>
        <h1 className="mb-4 text-2xl font-extrabold text-gray-900">{plato}</h1>

        <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-gray-500">
          Ingredientes de la receta
        </p>

        {ingredientes.length > 0 ? (
          <div className="mb-5 flex flex-col">
            {ingredientes.map((ing) => (
              <div
                key={ing.insumoId}
                className="flex items-center justify-between gap-3.5 border-b border-gray-100 py-3 last:border-none"
              >
                <span className="text-sm font-semibold text-gray-800">{ing.nombre}</span>
                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10.5px] font-bold text-orange-600">
                  {ing.cantidadRequerida} {ing.unidad}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
            Todavía no hay receta cargada para este plato en administración.
          </p>
        )}

        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-3.5 text-center text-xs text-gray-500">
          Esta lista viene de la receta guardada en el sistema — si falta o sobra algo aquí, repórtalo en
          administración para mantenerla al día.
        </p>
      </div>
    </div>
  )
}
