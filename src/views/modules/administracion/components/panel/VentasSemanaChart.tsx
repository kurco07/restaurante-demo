import type { VentaDia } from '../../../../../models/types'
import { PanelCard } from './PanelCard'

interface VentasSemanaChartProps {
  ventas: VentaDia[]
  ventaMaxima: number
}

// Alto en px de la barra más alta; las demás se escalan proporcionalmente
const ALTO_MAXIMO_BARRA = 110

export function VentasSemanaChart({ ventas, ventaMaxima }: VentasSemanaChartProps) {
  return (
    <PanelCard
      titulo="Ventas de la semana"
      subtitulo="Ingresos por día · últimos 7 días"
      enlace={{ label: 'Ver reporte completo', to: '/proximamente' }}
    >
      <div className="flex h-40 items-end gap-3">
        {ventas.map((v) => (
          <div key={v.dia} className="flex h-full flex-1 flex-col items-center justify-end">
            <div className={`mb-1.5 text-[10.5px] font-bold ${v.esHoy ? 'text-[var(--orange-dark)]' : 'text-[var(--ink-soft)]'}`}>
              ${v.total.toLocaleString('en-US')}
            </div>
            <div
              className="w-full max-w-8 rounded-t-lg rounded-b-sm"
              style={{
                height: (v.total / ventaMaxima) * ALTO_MAXIMO_BARRA,
                background: v.esHoy ? 'linear-gradient(180deg, #ffb877, var(--orange))' : 'var(--orange-bg)',
              }}
            />
            <div className={`mt-2 text-[11px] ${v.esHoy ? 'font-bold text-[var(--orange-dark)]' : 'font-semibold text-[var(--ink-soft)]'}`}>
              {v.dia}
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  )
}
