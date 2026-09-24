import type { ReactNode } from 'react'
import type { ProductoMasVendido } from '../../../../../models/types'
import { formatearMoneda } from '../constants'
import { PanelCard } from './PanelCard'

interface MasVendidosProps {
  productos: ProductoMasVendido[]
}

// Miniaturas decorativas (degradado + ícono) hasta que los platos tengan foto real.
// Se asignan por posición en la lista.
const miniaturas: { fondo: string; icono: ReactNode }[] = [
  {
    fondo: 'linear-gradient(135deg, #ffb877, #ff7a1a)',
    icono: <path d="M3 10h18M3 14h18M4 10a8 6 0 0116 0M4 14a1 1 0 001 1h14a1 1 0 001-1" />,
  },
  {
    fondo: 'linear-gradient(135deg, #ffdca0, #ffb04a)',
    icono: <path d="M6 8l1 12h10l1-12M5 8h14M9 8V5a3 3 0 016 0v3" />,
  },
  {
    fondo: 'linear-gradient(135deg, #ffcf6b, #f5a623)',
    icono: <circle cx="12" cy="12" r="9" />,
  },
  {
    fondo: 'linear-gradient(135deg, #ff9d6b, #e0650a)',
    icono: <path d="M7 3l1 14a2 2 0 002 2h4a2 2 0 002-2l1-14M7 8h10" />,
  },
]

export function MasVendidos({ productos }: MasVendidosProps) {
  return (
    <PanelCard titulo="Más vendidos hoy" subtitulo="Unidades e ingresos por producto">
      <div className="flex flex-col gap-3.5">
        {productos.map((producto, i) => {
          const miniatura = miniaturas[i % miniaturas.length]
          return (
            <div key={producto.id} className="flex items-center gap-3">
              <div
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: miniatura.fondo }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.4} className="h-[19px] w-[19px]">
                  {miniatura.icono}
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold">{producto.nombre}</div>
                <div className="text-[11.5px] text-[var(--ink-soft)]">{producto.unidades} vendidas</div>
              </div>
              <div className="whitespace-nowrap text-[13px] font-bold text-[var(--orange-dark)]">
                {formatearMoneda(producto.ingresos)}
              </div>
            </div>
          )
        })}
      </div>
    </PanelCard>
  )
}
