import type { ItemCarritoAutopedido } from '../../../../models/types'

interface PedidoMesaProps {
  mesa: string
  items: ItemCarritoAutopedido[]
  total: number
  onQuitar: (id: string) => void
  onEnviar: () => void
  enviando: boolean
  error: string | null
}

// Carrito del cliente. El envío real a cocina es la función segura
// enviar_pedido_autopedido (Fase 3, Módulo 2); el cierre y el pago
// siempre los hace el mesonero, nunca el cliente.
export function PedidoMesa({ mesa, items, total, onQuitar, onEnviar, enviando, error }: PedidoMesaProps) {
  return (
    <div className="px-5">
      <p className="mb-3 mt-1 text-[17px] font-extrabold text-gray-900">Tu pedido en Mesa {mesa}</p>

      {items.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-gray-500">Todavía no agregaste platos.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.id} className="rounded-[14px] border border-orange-100 bg-white px-3.5 py-3">
              <div className="flex justify-between gap-2 text-[13.5px] font-bold text-gray-900">
                <span>
                  {item.cantidad > 1 && `${item.cantidad}× `}
                  {item.plato.nombre}
                </span>
                <span>${(item.plato.precio * item.cantidad).toFixed(2)}</span>
              </div>
              {item.nota && <div className="mt-1 text-[11px] font-semibold text-orange-600">Nota: {item.nota}</div>}
              <button type="button" onClick={() => onQuitar(item.id)} className="mt-1 text-[11px] font-bold text-red-500">
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="my-3.5 flex justify-between rounded-[14px] bg-orange-50 p-3.5 text-[15px] font-extrabold text-gray-900">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      {error && (
        <p className="mb-3 rounded-[12px] bg-red-50 px-3.5 py-2.5 text-center text-[12.5px] font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onEnviar}
        disabled={items.length === 0 || enviando}
        className="mb-4 w-full rounded-2xl bg-orange-500 py-3.5 text-[14px] font-bold text-white disabled:opacity-50"
      >
        {enviando ? 'Enviando…' : 'Enviar pedido a cocina'}
      </button>
    </div>
  )
}
