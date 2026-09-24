import type { Orden } from './ordenesMock'
import { accionSegunEstado, etiquetaEstadoOrden } from './ordenesMock'

interface OrderDetailModalProps {
  orden: Orden
  onCerrar: () => void
  onVerReceta: (plato: string) => void
}

export function OrderDetailModal({ orden, onCerrar, onVerReceta }: OrderDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[22px] bg-white shadow-2xl">
        <div className="p-6 pb-5">
          <div className="mb-1 flex items-start justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-orange-600">
                {etiquetaEstadoOrden[orden.estado]}
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900">{orden.mesa}</h2>
            </div>
            <button type="button" onClick={onCerrar} className="text-lg text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="my-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-orange-50 px-3 py-2.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500">Pedido</div>
              <div className="text-sm font-extrabold text-gray-900">#{orden.id}</div>
            </div>
            <div className="rounded-xl bg-orange-50 px-3 py-2.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500">Mesonero</div>
              <div className="text-sm font-extrabold text-gray-900">{orden.mesonero ?? 'Sin asignar'}</div>
            </div>
            <div className="rounded-xl bg-orange-50 px-3 py-2.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500">Hora de pedido</div>
              <div className="text-sm font-extrabold text-gray-900">{orden.creado}</div>
            </div>
            <div className="rounded-xl bg-orange-50 px-3 py-2.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500">Transcurrido</div>
              <div className="text-sm font-extrabold text-gray-900">{orden.tiempo}</div>
            </div>
          </div>

          <div className="border-t border-gray-100">
            {orden.items.map((item, i) => (
              <div key={`${item.plato}-${i}`} className="flex items-center justify-between gap-3 border-b border-gray-100 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900">
                    {item.cantidad}× {item.plato}
                  </div>
                  {item.mod && <div className="mt-0.5 text-xs italic text-gray-500">{item.mod}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => onVerReceta(item.plato)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-600 transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
                >
                  📖 Ver receta
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-xl border border-gray-200 bg-orange-50 py-2.5 text-sm font-bold text-gray-600"
            >
              Cerrar
            </button>
            <button type="button" className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white">
              {accionSegunEstado[orden.estado]}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
