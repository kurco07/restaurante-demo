import type { RotacionInsumo } from '../../../../models/types'
import { formatearMoneda } from '../../../components/ui/constants'

type EstadoRotacion = 'bajo_minimo' | 'por_agotarse' | 'lento' | 'sin_movimiento' | 'normal'

// Umbrales del estado de cada insumo, en días que alcanza el stock al
// ritmo de consumo del período. Son un punto de partida, no una decisión
// de negocio cerrada: ajustarlos si al restaurante le sirven otros.
const DIAS_POR_AGOTARSE = 3
const DIAS_LENTO = 30

const ESTADOS: Record<EstadoRotacion, { etiqueta: string; clase: string; orden: number }> = {
  bajo_minimo: { etiqueta: 'Bajo el mínimo', clase: 'bg-[var(--red-bg)] text-[var(--red)]', orden: 0 },
  por_agotarse: { etiqueta: 'Por agotarse', clase: 'bg-[var(--orange-bg)] text-[var(--orange-dark)]', orden: 1 },
  lento: { etiqueta: 'Rota lento', clase: 'bg-[var(--gray-bg)] text-[var(--ink-soft)]', orden: 2 },
  sin_movimiento: { etiqueta: 'Sin movimiento', clase: 'bg-[var(--gray-bg)] text-[var(--ink-soft)]', orden: 3 },
  normal: { etiqueta: 'Normal', clase: 'bg-[var(--green-bg)] text-[var(--green)]', orden: 4 },
}

function estadoDe(f: RotacionInsumo): EstadoRotacion {
  if (f.stock_minimo != null && f.stock_actual <= f.stock_minimo) return 'bajo_minimo'
  if (f.consumo === 0 && f.merma === 0) return 'sin_movimiento'
  if (f.dias_alcanza != null && f.dias_alcanza <= DIAS_POR_AGOTARSE) return 'por_agotarse'
  if (f.dias_alcanza != null && f.dias_alcanza > DIAS_LENTO) return 'lento'
  return 'normal'
}

function cantidad(valor: number, unidad: string) {
  return `${Number(valor).toLocaleString('es', { maximumFractionDigits: 2 })} ${unidad}`
}

// Rotación de inventario por insumo (Fase 5, Módulo 1). Primero lo que
// pide acción (bajo el mínimo, por agotarse), después lo que está parado.
export function TablaRotacion({ filas }: { filas: RotacionInsumo[] }) {
  if (filas.length === 0) {
    return <p className="py-4 text-center text-[12.5px] text-[var(--ink-soft)]">Sin insumos con inventario registrado.</p>
  }

  const ordenadas = filas
    .map((f) => ({ ...f, estado: estadoDe(f) }))
    .sort(
      (a, b) =>
        ESTADOS[a.estado].orden - ESTADOS[b.estado].orden ||
        (a.dias_alcanza ?? Infinity) - (b.dias_alcanza ?? Infinity) ||
        a.insumo.localeCompare(b.insumo),
    )

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            <th className="py-2 pr-3">Insumo</th>
            <th className="py-2 pr-3 text-right">Consumido</th>
            <th className="py-2 pr-3 text-right">Merma</th>
            <th className="py-2 pr-3 text-right">Stock actual</th>
            <th className="py-2 pr-3 text-right" title="Stock actual × costo de la última compra recibida">
              Valor en stock
            </th>
            <th className="py-2 pr-3 text-right" title="Veces que se gastó el stock promedio en el período">
              Rotación
            </th>
            <th className="py-2 pr-3 text-right" title="Días que dura el stock actual al ritmo de consumo del período">
              Alcanza para
            </th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((f) => (
            <tr key={f.insumo_id} className="border-b border-[var(--border)] last:border-0">
              <td className="py-2.5 pr-3 font-bold">{f.insumo}</td>
              <td className="py-2.5 pr-3 text-right">{cantidad(f.consumo, f.unidad)}</td>
              <td className="py-2.5 pr-3 text-right text-[var(--ink-soft)]">
                {f.merma > 0 ? cantidad(f.merma, f.unidad) : '—'}
              </td>
              <td className="py-2.5 pr-3 text-right">
                {cantidad(f.stock_actual, f.unidad)}
                {f.stock_minimo != null && (
                  <div className="text-[10.5px] text-[var(--ink-soft)]">mín. {cantidad(f.stock_minimo, f.unidad)}</div>
                )}
              </td>
              <td className="py-2.5 pr-3 text-right">
                {f.valor_stock != null ? formatearMoneda(Number(f.valor_stock)) : '—'}
                {f.costo_unitario != null && (
                  <div className="text-[10.5px] text-[var(--ink-soft)]">
                    {formatearMoneda(Number(f.costo_unitario))}/{f.unidad}
                  </div>
                )}
              </td>
              <td className="py-2.5 pr-3 text-right">{f.rotacion != null ? `${f.rotacion}×` : '—'}</td>
              <td className="py-2.5 pr-3 text-right">
                {f.dias_alcanza != null ? `${f.dias_alcanza} ${f.dias_alcanza === 1 ? 'día' : 'días'}` : '—'}
              </td>
              <td className="py-2.5">
                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${ESTADOS[f.estado].clase}`}>
                  {ESTADOS[f.estado].etiqueta}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
