import type { InsumoAdmin } from '../../../../../models/types'
import { estaBajoStock } from '../../../../../controllers/administracion/useInsumosAdmin'
import { formatearMoneda } from '../constants'
import { FilaTabla, TablaAdmin } from '../comunes'
import { EstadoChip } from '../panel/EstadoChip'

interface TablaInsumosProps {
  insumos: InsumoAdmin[]
  total: number
  seleccionadoId: string | undefined
  onSeleccionar: (id: string) => void
}

export function TablaInsumos({ insumos, total, seleccionadoId, onSeleccionar }: TablaInsumosProps) {
  return (
    <TablaAdmin
      columnas="2.1fr 0.9fr 0.9fr 0.9fr 1.2fr 1fr"
      encabezados={[
        { label: 'Insumo' },
        { label: 'Stock actual', alineacion: 'centro' },
        { label: 'Stock mín.', alineacion: 'centro' },
        { label: 'Costo unit.', alineacion: 'centro' },
        { label: 'Proveedor' },
        { label: 'Estado' },
      ]}
      pie={`Mostrando ${insumos.length} de ${total} insumos`}
    >
      {insumos.map((insumo) => (
        <FilaTabla
          key={insumo.id}
          onClick={() => onSeleccionar(insumo.id)}
          className={insumo.id === seleccionadoId ? 'bg-[var(--orange-bg)]' : ''}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--orange-bg)] text-[11.5px] font-extrabold text-[var(--orange-dark)]">
              {insumo.iniciales}
            </div>
            <div className="min-w-0">
              <div className="truncate font-bold">{insumo.nombre}</div>
              <div className="text-[11px] text-[var(--ink-soft)]">{insumo.categoria}</div>
            </div>
          </div>
          <span className="text-center font-semibold">
            {insumo.stockActual} {insumo.unidadCorta}
          </span>
          <span className="text-center font-semibold">
            {insumo.stockMinimo} {insumo.unidadCorta}
          </span>
          <span className="text-center font-semibold">{formatearMoneda(insumo.costoUnitario)}</span>
          <span className="text-[12.5px] text-[var(--ink-soft)]">{insumo.proveedor}</span>
          <span>
            {estaBajoStock(insumo) ? <EstadoChip tono="rojo">Bajo stock</EstadoChip> : <EstadoChip tono="verde">OK</EstadoChip>}
          </span>
        </FilaTabla>
      ))}
    </TablaAdmin>
  )
}
