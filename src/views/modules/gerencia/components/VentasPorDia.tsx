import type { VentaPorDia } from '../../../../models/types'
import { formatearMoneda } from '../../../components/ui/constants'

const ALTO_MAXIMO_BARRA = 140
const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

// 'YYYY-MM-DD' → Date local sin corrimiento de zona horaria.
function fechaDe(dia: string) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d)
}

// Barras verticales de ventas por día. Con períodos largos (más de 14
// días) se ocultan los montos sobre cada barra y se rotulan menos días,
// para que no se encimen; el monto exacto queda en el tooltip.
export function VentasPorDia({ dias }: { dias: VentaPorDia[] }) {
  const maximo = Math.max(...dias.map((d) => d.ventas)) || 1
  const denso = dias.length > 14

  return (
    <div className="flex h-48 items-end gap-1.5">
      {dias.map((d, i) => {
        const fecha = fechaDe(d.dia)
        const rotular = !denso || i % 5 === 0 || i === dias.length - 1
        return (
          <div
            key={d.dia}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            title={`${fecha.toLocaleDateString('es')}: ${formatearMoneda(d.ventas)} · ${d.cuentas} cuentas`}
          >
            {!denso && d.ventas > 0 && (
              <div className="mb-1.5 text-[10px] font-bold text-[var(--ink-soft)]">{formatearMoneda(d.ventas)}</div>
            )}
            <div
              className="w-full max-w-12 rounded-t-md rounded-b-sm"
              style={{
                height: Math.max(d.ventas > 0 ? 3 : 1, (d.ventas / maximo) * ALTO_MAXIMO_BARRA),
                background: d.ventas > 0 ? 'var(--orange)' : 'var(--gray-bg)',
              }}
            />
            <div className="mt-2 h-7 text-center text-[10px] font-semibold leading-tight text-[var(--ink-soft)]">
              {rotular && (
                <>
                  {!denso && <div>{DIAS_SEMANA[fecha.getDay()]}</div>}
                  <div>
                    {fecha.getDate()}/{fecha.getMonth() + 1}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
