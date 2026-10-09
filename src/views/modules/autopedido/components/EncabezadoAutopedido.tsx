import type { VistaAutopedido } from '../../../../controllers/autopedido/useAutopedido'

interface EncabezadoAutopedidoProps {
  restaurante: string
  mesa: string
  vista: VistaAutopedido
  onCambiarVista: (vista: VistaAutopedido) => void
  itemsEnCarrito: number
}

export function EncabezadoAutopedido({ restaurante, mesa, vista, onCambiarVista, itemsEnCarrito }: EncabezadoAutopedidoProps) {
  return (
    <>
      <div className="px-5 pb-3 pt-5">
        <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-orange-600">{restaurante}</div>
        <h1 className="mb-0.5 mt-1 text-[22px] font-extrabold text-gray-900">Mesa {mesa} · ¡Bienvenido!</h1>
      </div>

      <div className="mx-5 mb-3 flex items-center gap-2 rounded-[10px] border border-orange-100 bg-orange-50 px-3 py-[9px] text-[11px] text-gray-500">
        Esta mesa es compartida — tu mesonero ve lo mismo que tú.
      </div>

      <div className="mx-5 mb-3 flex gap-1.5 rounded-xl bg-orange-50 p-1">
        <Pestana activa={vista === 'menu'} onClick={() => onCambiarVista('menu')}>
          Menú
        </Pestana>
        <Pestana activa={vista === 'pedido'} onClick={() => onCambiarVista('pedido')}>
          Tu pedido · {itemsEnCarrito}
        </Pestana>
      </div>
    </>
  )
}

function Pestana({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-[9px] p-2 text-center text-[12.5px] font-bold ${
        activa ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'
      }`}
    >
      {children}
    </button>
  )
}
