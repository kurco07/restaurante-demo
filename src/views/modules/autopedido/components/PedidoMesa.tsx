import type { ItemCarritoAutopedido } from '../../../../models/types'

interface PedidoMesaProps {
  mesa: string
  items: ItemCarritoAutopedido[]
  total: number
  onQuitar: (id: string) => void
}

// Carrito del cliente. El envío a cocina llega en Fase 3, Módulo 2; el
// cierre y el pago siempre los hace el mesonero, nunca el cliente.
export function PedidoMesa({ mesa, items, total, onQuitar }: PedidoMesaProps) {
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

      <p className="text-center text-[11.5px] text-gray-500">
        Por ahora, muéstrale este pedido a tu mesonero. Muy pronto podrás enviarlo directo a cocina desde aquí.
      </p>
    </div>
  )
}
