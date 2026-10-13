import type { Insumo, InventarioSede } from '../../../../../models/types'
import { FilaTabla, TablaAdmin } from '../comunes'
import { EstadoChip } from '../panel/EstadoChip'

interface TablaInsumosProps {
  insumos: Insumo[]
  inventarioPorInsumo: Map<string, InventarioSede>
  total: number
  onEditar: (id: string) => void
}

const ETIQUETA_TIPO: Record<Insumo['tipo'], string> = {
  exacto: 'Exacto',
  por_lote: 'Por lote',
  estimado: 'Estimado',
}

function estaBajoStock(inv: InventarioSede | undefined) {
  return Boolean(inv && inv.stock_minimo !== null && inv.cantidad_actual < inv.stock_minimo)
}

export function TablaInsumos({ insumos, inventarioPorInsumo, total, onEditar }: TablaInsumosProps) {
  return (
    <TablaAdmin
      columnas="2fr 1fr 1fr 1fr 1fr 0.7fr"
      encabezados={[
        { label: 'Insumo' },
        { label: 'Tipo', alineacion: 'centro' },
        { label: 'Stock actual', alineacion: 'centro' },
        { label: 'Stock mín.', alineacion: 'centro' },
        { label: 'Estado' },
        { label: '', alineacion: 'derecha' },
      ]}
      pie={`Mostrando ${insumos.length} de ${total} insumos`}
    >
      {insumos.map((insumo) => {
        const inv = inventarioPorInsumo.get(insumo.id)
        return (
          <FilaTabla key={insumo.id}>
            <div className="min-w-0">
              <div className="truncate font-bold">{insumo.nombre}</div>
              <div className="text-[11px] text-[var(--ink-soft)]">{insumo.unidad_de_medida}</div>
            </div>
            <span className="text-center text-[12px] text-[var(--ink-soft)]">{ETIQUETA_TIPO[insumo.tipo]}</span>
            <span className="text-center font-semibold">{inv?.cantidad_actual ?? '—'}</span>
            <span className="text-center font-semibold">{inv?.stock_minimo ?? '—'}</span>
            <span>
              {estaBajoStock(inv) ? <EstadoChip tono="rojo">Bajo stock</EstadoChip> : <EstadoChip tono="verde">OK</EstadoChip>}
            </span>
            <span className="text-right">
              <button
                type="button"
                onClick={() => onEditar(insumo.id)}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-[11.5px] font-bold text-[var(--orange-dark)] hover:bg-[var(--surface-alt)]"
              >
                Editar
              </button>
            </span>
          </FilaTabla>
        )
      })}
    </TablaAdmin>
  )
}
