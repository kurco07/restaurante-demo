import type { EstadoCostoPlato, RentabilidadPlato } from '../../../../models/types'
import { formatearMoneda } from '../../../components/ui/constants'

const ESTADOS: Record<EstadoCostoPlato, { etiqueta: string; clase: string }> = {
  ok: { etiqueta: 'Costo completo', clase: 'bg-[var(--green-bg)] text-[var(--green)]' },
  incompleto: { etiqueta: 'Costo incompleto', clase: 'bg-[var(--orange-bg)] text-[var(--orange-dark)]' },
  sin_receta: { etiqueta: 'Sin receta', clase: 'bg-[var(--gray-bg)] text-[var(--ink-soft)]' },
}

// Rentabilidad por plato (Fase 5, Módulo 1). Costo = receta × última
// compra recibida de cada insumo (migración 0012). Primero los que más
// ganancia dejan; los que no tienen costo completo, al final.
export function TablaRentabilidad({ filas }: { filas: RentabilidadPlato[] }) {
  if (filas.length === 0) {
    return <p className="py-4 text-center text-[12.5px] text-[var(--ink-soft)]">Sin platos vendidos en el período.</p>
  }

  const ordenEstado: Record<EstadoCostoPlato, number> = { ok: 0, incompleto: 1, sin_receta: 2 }
  const ordenadas = [...filas].sort(
    (a, b) =>
      ordenEstado[a.estado] - ordenEstado[b.estado] ||
      Number(b.ganancia ?? 0) - Number(a.ganancia ?? 0) ||
      Number(b.importe) - Number(a.importe),
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            <th className="py-2 pr-3">Plato</th>
            <th className="py-2 pr-3 text-right">Vendidos</th>
            <th className="py-2 pr-3 text-right" title="Precio real cobrado, promedio del período">
              Precio
            </th>
            <th className="py-2 pr-3 text-right" title="Receta × última compra recibida de cada insumo">
              Costo
            </th>
            <th className="py-2 pr-3 text-right">Margen</th>
            <th className="py-2 pr-3 text-right">Ganancia</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((f) => (
            <tr key={f.menu_item_id} className="border-b border-[var(--border)] last:border-0">
              <td className="py-2.5 pr-3 font-bold">{f.plato}</td>
              <td className="py-2.5 pr-3 text-right">{f.vendidos}</td>
              <td className="py-2.5 pr-3 text-right">{formatearMoneda(Number(f.precio_promedio))}</td>
              <td className="py-2.5 pr-3 text-right">
                {f.costo_unitario == null ? (
                  '—'
                ) : (
                  <span className={f.estado === 'incompleto' ? 'text-[var(--ink-soft)]' : ''}>
                    {f.estado === 'incompleto' && '≥ '}
                    {formatearMoneda(Number(f.costo_unitario))}
                  </span>
                )}
              </td>
              <td className="py-2.5 pr-3 text-right">
                {f.margen_unitario == null ? (
                  '—'
                ) : (
                  <>
                    {formatearMoneda(Number(f.margen_unitario))}
                    <div className="text-[10.5px] text-[var(--ink-soft)]">{f.margen_pct}%</div>
                  </>
                )}
              </td>
              <td className={`py-2.5 pr-3 text-right font-bold ${Number(f.ganancia) < 0 ? 'text-[var(--red)]' : ''}`}>
                {f.ganancia == null ? '—' : formatearMoneda(Number(f.ganancia))}
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
