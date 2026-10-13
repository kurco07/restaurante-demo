import type { LoteInsumo } from '../../../../../models/types'
import { estadoLote } from '../../../../../controllers/administracion/useLotesInsumo'
import { FilaTabla, TablaAdmin } from '../comunes'
import { EstadoChip } from '../panel/EstadoChip'

const chipPorEstado = {
  por_vencer: { tono: 'rojo' as const, label: 'Por vencer' },
  activo: { tono: 'verde' as const, label: 'Activo' },
  agotado: { tono: 'gris' as const, label: 'Agotado' },
}

function formatearFecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
}

interface TablaLotesProps {
  lotes: LoteInsumo[]
  primerActivoId: string | undefined
  unidad: string
}

export function TablaLotes({ lotes, primerActivoId, unidad }: TablaLotesProps) {
  return (
    <TablaAdmin
      columnas="1.6fr 1.1fr 1.2fr 1fr"
      encabezados={[
        { label: 'Lote' },
        { label: 'Vencimiento', alineacion: 'centro' },
        { label: 'Cantidad', alineacion: 'centro' },
        { label: 'Estado' },
      ]}
      pie={
        lotes.length
          ? `Ordenado por vencimiento (FEFO) · ${lotes.length} lote${lotes.length === 1 ? '' : 's'}`
          : 'Este insumo todavía no tiene lotes registrados'
      }
    >
      {lotes.map((lote) => {
        const estado = estadoLote(lote)
        const chip = chipPorEstado[estado]
        const usarPrimero = lote.id === primerActivoId
        return (
          <FilaTabla key={lote.id} className={usarPrimero ? 'bg-[var(--orange-bg)]' : estado === 'agotado' ? 'opacity-55' : ''}>
            <div className="min-w-0">
              <div className="font-bold">
                Ingreso: {formatearFecha(lote.abierto_en)}
                {usarPrimero && (
                  <span className="ml-1.5 rounded-full border border-[var(--orange)] bg-white px-1.5 py-px align-middle text-[9.5px] font-extrabold text-[var(--orange-dark)]">
                    Usar primero
                  </span>
                )}
              </div>
            </div>
            <span className={`text-center ${estado === 'por_vencer' ? 'font-bold text-[var(--red)]' : 'font-semibold'}`}>
              {formatearFecha(lote.fecha_vencimiento)}
            </span>
            <span className="text-center font-semibold">
              {lote.cantidad_restante} / {lote.cantidad_inicial} {unidad}
            </span>
            <span>
              <EstadoChip tono={chip.tono}>{chip.label}</EstadoChip>
            </span>
          </FilaTabla>
        )
      })}
    </TablaAdmin>
  )
}
