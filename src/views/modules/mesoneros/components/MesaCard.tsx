import type { CSSProperties } from 'react'

export type EstadoMesaVista = 'libre' | 'mia' | 'otro' | 'por_limpiar'

interface MesaCardProps {
  numero: string
  estado: EstadoMesaVista
  etiqueta: string
  selected?: boolean
  style?: CSSProperties
  onClick?: () => void
}

const claseSegunEstado: Record<EstadoMesaVista, string> = {
  libre: 'bg-white border-dashed border-gray-300 text-gray-400',
  mia: 'bg-orange-50 border-orange-400 text-orange-600',
  otro: 'bg-gray-100 border-gray-300 text-gray-500',
  por_limpiar: 'bg-amber-50/80 border-amber-200 text-gray-400',
}

export function MesaCard({ numero, estado, etiqueta, selected = false, style, onClick }: MesaCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border-2 text-center shadow-sm transition-shadow hover:shadow-md ${
        claseSegunEstado[estado]
      } ${selected ? 'ring-2 ring-orange-300 ring-offset-1' : ''}`}
    >
      <span className="text-sm font-extrabold leading-none">{numero}</span>
      <span className="mt-0.5 text-[8px] font-bold leading-none">{etiqueta}</span>
    </button>
  )
}
