import type { IndicadoresPanel, PeriodoPanel } from '../../../../../models/types'
import { formatearMoneda } from '../constants'

interface IndicadoresGridProps {
  indicadores: IndicadoresPanel
  periodo: PeriodoPanel
  productosBajoStock: number
}

const sufijoPeriodo: Record<PeriodoPanel, string> = {
  hoy: 'de hoy',
  semana: 'de la semana',
  mes: 'del mes',
}

function Delta({ valor }: { valor: number }) {
  const sube = valor >= 0
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-bold ${
        sube ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'
      }`}
    >
      {sube ? '+' : ''}
      {valor}%
    </span>
  )
}

export function IndicadoresGrid({ indicadores, periodo, productosBajoStock }: IndicadoresGridProps) {
  const tarjetas = [
    { valor: formatearMoneda(indicadores.ventas), delta: indicadores.ventasDelta, label: `Ventas ${sufijoPeriodo[periodo]}` },
    { valor: String(indicadores.pedidos), delta: indicadores.pedidosDelta, label: `Pedidos ${sufijoPeriodo[periodo]}` },
    { valor: formatearMoneda(indicadores.ticketPromedio), delta: indicadores.ticketPromedioDelta, label: 'Ticket promedio' },
  ]

  return (
    <div className="mb-[22px] grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {tarjetas.map((t) => (
        <div key={t.label} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="flex items-start justify-between">
            <div className="text-[23px] font-extrabold">{t.valor}</div>
            <Delta valor={t.delta} />
          </div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">{t.label}</div>
        </div>
      ))}

      {/* El stock es el actual, no depende del período elegido */}
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
        <div className="text-[23px] font-extrabold text-[var(--red)]">{productosBajoStock}</div>
        <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Productos con bajo stock</div>
      </div>
    </div>
  )
}
