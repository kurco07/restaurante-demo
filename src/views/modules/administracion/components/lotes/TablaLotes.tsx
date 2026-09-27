import type { EstadoLote, LoteInsumo } from '../../../../../models/types'
import { formatearMoneda } from '../constants'
import { FilaTabla, TablaAdmin } from '../comunes'
import { EstadoChip } from '../panel/EstadoChip'

const chipPorEstado: Record<EstadoLote, { tono: 'verde' | 'rojo' | 'gris'; label: string }> = {
  por_vencer: { tono: 'rojo', label: 'Por vencer' },
  activo: { tono: 'verde', label: 'Activo' },
  agotado: { tono: 'gris', label: 'Agotado' },
}

interface TablaLotesProps {
  lotes: LoteInsumo[]
  unidad: string
}

export function TablaLotes({ lotes, unidad }: TablaLotesProps) {
  return (
    <TablaAdmin
      columnas="1.8fr 1.1fr 1fr 0.9fr 1.3fr 1fr"
      encabezados={[
        { label: 'Lote' },
        { label: 'Vencimiento', alineacion: 'centro' },
        { label: 'Cantidad', alineacion: 'centro' },
        { label: 'Costo unit.', alineacion: 'centro' },
        { label: 'Proveedor' },
        { label: 'Estado' },
      ]}
      pie={
        lotes.length
          ? `Ordenado por vencimiento (FEFO) · mostrando los últimos ${lotes.length} lotes`
          : 'Este insumo todavía no tiene lotes registrados'
      }
    >
      {lotes.map((lote) => {
        const chip = chipPorEstado[lote.estado]
        return (
          <FilaTabla
            key={lote.id}
            className={
              lote.usarPrimero ? 'bg-[var(--orange-bg)]' : lote.estado === 'agotado' ? 'opacity-55' : ''
            }
          >
            <div className="min-w-0">
              <div className="font-bold">
                {lote.codigo}
                {lote.usarPrimero && (
                  <span className="ml-1.5 rounded-full border border-[var(--orange)] bg-white px-1.5 py-px align-middle text-[9.5px] font-extrabold text-[var(--orange-dark)]">
                    Usar primero
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--ink-soft)]">Ingreso: {lote.fechaIngreso}</div>
            </div>
            <span
              className={`text-center ${lote.estado === 'por_vencer' ? 'font-bold text-[var(--red)]' : 'font-semibold'}`}
            >
              {lote.fechaVencimiento}
            </span>
            <span className="text-center font-semibold">
              {lote.cantidadRestante} / {lote.cantidadInicial} {unidad}
            </span>
            <span className="text-center font-semibold">{formatearMoneda(lote.costoUnitario)}</span>
            <span className="text-[12.5px] text-[var(--ink-soft)]">{lote.proveedor}</span>
            <span>
              <EstadoChip tono={chip.tono}>{chip.label}</EstadoChip>
            </span>
          </FilaTabla>
        )
      })}
    </TablaAdmin>
  )
}
