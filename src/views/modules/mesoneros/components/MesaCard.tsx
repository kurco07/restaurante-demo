import type { CSSProperties } from 'react'

export type EstadoMesaVista = 'libre' | 'mia' | 'otro' | 'sin_atender' | 'por_limpiar'

interface MesaCardProps {
  numero: string
  estado: EstadoMesaVista
  etiqueta: string
  // Tiene un pedido de autopedido esperando aprobación — se marca en la
  // mesa misma, no solo en el aviso general de arriba del mapa, para que
  // no se pierda si la mesa ya tiene mesonero asignado.
  pendienteAprobar?: boolean
  selected?: boolean
  style?: CSSProperties
  onClick?: () => void
}

const claseSegunEstado: Record<EstadoMesaVista, string> = {
  libre: 'bg-white border-dashed border-gray-300 text-gray-400',
  mia: 'bg-orange-50 border-orange-400 text-orange-600',
  otro: 'bg-gray-100 border-gray-300 text-gray-500',
  sin_atender: 'bg-sky-50 border-sky-400 text-sky-700',
  por_limpiar: 'bg-amber-50/80 border-amber-200 text-gray-400',
}

export function MesaCard({
  numero,
  estado,
  etiqueta,
  pendienteAprobar = false,
  selected = false,
  style,
  onClick,
}: MesaCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border-2 text-center shadow-sm transition-shadow hover:shadow-md ${
        claseSegunEstado[estado]
      } ${selected ? 'ring-2 ring-orange-300 ring-offset-1' : ''}`}
    >
      {pendienteAprobar && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-orange-500 text-[10px] text-white shadow">
          🔔
        </span>
      )}
      <span className="text-sm font-extrabold leading-none">{numero}</span>
      <span className="mt-0.5 text-[8px] font-bold leading-none">{etiqueta}</span>
    </button>
  )
}
