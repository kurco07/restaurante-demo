import type { ItemCocina, TicketCocina } from '../../../../controllers/cocina/useCocina'
import { ACCION_SEGUN_ESTADO, ETIQUETA_ESTADO } from '../../../../controllers/cocina/useCocina'

function tiempoTranscurrido(creadoEnIso: string) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(creadoEnIso).getTime()) / 60000))
  return `${minutos} min`
}

function horaPedido(creadoEnIso: string) {
  return new Date(creadoEnIso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

interface OrderDetailModalProps {
  ticket: TicketCocina
  avanzando: boolean
  onCerrar: () => void
  onVerReceta: (item: ItemCocina) => void
  onAvanzarEstado: () => void
}

export function OrderDetailModal({ ticket, avanzando, onCerrar, onVerReceta, onAvanzarEstado }: OrderDetailModalProps) {
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
                {ETIQUETA_ESTADO[ticket.estado]}
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900">Mesa {ticket.mesa}</h2>
            </div>
            <button type="button" onClick={onCerrar} className="text-lg text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="my-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-orange-50 px-3 py-2.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500">Mesonero</div>
              <div className="text-sm font-extrabold text-gray-900">{ticket.mesonero ?? 'Sin mesonero (pedido por QR)'}</div>
            </div>
            <div className="rounded-xl bg-orange-50 px-3 py-2.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500">Hora de pedido</div>
              <div className="text-sm font-extrabold text-gray-900">{horaPedido(ticket.creadoEn)}</div>
            </div>
            <div className="col-span-2 rounded-xl bg-orange-50 px-3 py-2.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500">Transcurrido</div>
              <div className="text-sm font-extrabold text-gray-900">{tiempoTranscurrido(ticket.creadoEn)}</div>
            </div>
          </div>

          <div className="border-t border-gray-100">
            {ticket.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 border-b border-gray-100 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900">
                    {item.cantidad}× {item.plato}
                  </div>
                  {item.notas && <div className="mt-0.5 text-xs italic text-gray-500">{item.notas}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => onVerReceta(item)}
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
            <button
              type="button"
              onClick={onAvanzarEstado}
              disabled={avanzando}
              className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {avanzando ? 'Actualizando…' : ACCION_SEGUN_ESTADO[ticket.estado]}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
