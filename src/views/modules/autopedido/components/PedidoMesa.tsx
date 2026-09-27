import type { ItemPedidoMesa } from '../../../../models/types'

interface PedidoMesaProps {
  mesa: number
  items: ItemPedidoMesa[]
  total: number
}

// El cliente solo puede VER su cuenta: el cierre y el pago siempre los hace el mesonero.
export function PedidoMesa({ mesa, items, total }: PedidoMesaProps) {
  return (
    <div className="px-5">
      <p className="mb-3 mt-1 text-[17px] font-extrabold text-gray-900">Tu pedido en Mesa {mesa}</p>

      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.id} className="rounded-[14px] border border-orange-100 bg-white px-3.5 py-3">
            <div className="flex justify-between text-[13.5px] font-bold text-gray-900">
              <span>
                {item.cantidad > 1 && `${item.cantidad}× `}
                {item.nombre}
              </span>
              <span>${item.precioTotal.toFixed(2)}</span>
            </div>
            {item.modificaciones.length > 0 && (
              <div className="mt-1 text-[11px] font-semibold text-orange-600">{item.modificaciones.join(' · ')}</div>
            )}
            <div className="mt-1 text-[10.5px] text-gray-500">{item.agregadoPor}</div>
          </div>
        ))}
      </div>

      <div className="my-3.5 rounded-xl border border-dashed border-orange-100 px-3.5 py-3 text-xs text-gray-500">
        + Agregar nota general para cocina (ej. alergias, ocasión especial)
      </div>

      <div className="mb-3 flex justify-between rounded-[14px] bg-orange-50 p-3.5 text-[15px] font-extrabold text-gray-900">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <button type="button" className="w-full rounded-xl bg-[#2b2118] p-[13px] text-center text-[13.5px] font-bold text-white">
        Ver mi cuenta
      </button>
    </div>
  )
}
