import type { TicketPorAprobar } from '../../../../controllers/pedido/usePorAprobar'

interface SolicitudesAutopedidoModalProps {
  tickets: TicketPorAprobar[]
  aprobandoId: string | null
  onAprobar: (ticket: TicketPorAprobar) => void
  onCerrar: () => void
}

// Pedidos que un cliente mandó por QR y todavía no confirmó ningún
// mesonero — se aprueban aquí (y de paso, si la mesa no tenía mesonero
// asignado porque la abrió el cliente, queda asignado quien aprueba).
export function SolicitudesAutopedidoModal({
  tickets,
  aprobandoId,
  onAprobar,
  onCerrar,
}: SolicitudesAutopedidoModalProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[22px] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-gray-900">Pedidos por aprobar</h2>
          <button type="button" onClick={onCerrar} className="text-lg text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-500">
          Un cliente pidió por QR — confírmalo con la mesa antes de mandarlo a cocina.
        </p>

        {tickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No hay pedidos pendientes de aprobar.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((ticket) => (
              <div key={ticket.sesionId} className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
                <p className="mb-2 text-[15px] font-extrabold text-gray-900">Mesa {ticket.mesa}</p>
                <ul className="mb-3 text-sm">
                  {ticket.items.map((item) => (
                    <li key={item.id} className="py-0.5">
                      <span className="mr-1.5 font-extrabold text-orange-600">{item.cantidad}×</span>
                      {item.plato}
                      {item.notas && <div className="text-[10.5px] italic text-gray-500">{item.notas}</div>}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onAprobar(ticket)}
                  disabled={aprobandoId === ticket.sesionId}
                  className="w-full rounded-lg bg-orange-500 py-2.5 text-center text-[13px] font-bold text-white disabled:opacity-50"
                >
                  {aprobandoId === ticket.sesionId ? 'Aprobando…' : 'Aprobar y enviar a cocina'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
