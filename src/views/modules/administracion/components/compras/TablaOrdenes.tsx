import type { OrdenCompra } from '../../../../../models/types'
import { totalOrden } from '../../../../../controllers/administracion/useCompras'
import { formatearMoneda } from '../constants'
import { FilaTabla, TablaAdmin } from '../comunes'
import { EstadoOrdenChip } from './EstadoOrdenChip'

interface TablaOrdenesProps {
  ordenes: OrdenCompra[]
  totalMes: number
  seleccionadaId: string | undefined
  onSeleccionar: (id: string) => void
}

export function TablaOrdenes({ ordenes, totalMes, seleccionadaId, onSeleccionar }: TablaOrdenesProps) {
  return (
    <TablaAdmin
      columnas="1fr 1.5fr 0.8fr 0.9fr 1.2fr 1fr"
      encabezados={[
        { label: 'Orden' },
        { label: 'Proveedor' },
        { label: 'Insumos', alineacion: 'centro' },
        { label: 'Total', alineacion: 'derecha' },
        { label: 'Estado' },
        { label: 'Fecha' },
      ]}
      pie={`Mostrando ${ordenes.length} de ${totalMes} órdenes de este mes`}
    >
      {ordenes.map((orden) => (
        <FilaTabla
          key={orden.id}
          onClick={() => onSeleccionar(orden.id)}
          className={orden.id === seleccionadaId ? 'bg-[var(--orange-bg)]' : ''}
        >
          <span className="font-bold">{orden.codigo}</span>
          <span className="font-semibold">{orden.proveedor}</span>
          <span className="text-center font-semibold">{orden.items.length}</span>
          <span className="text-right font-bold">{formatearMoneda(totalOrden(orden))}</span>
          <span>
            <EstadoOrdenChip estado={orden.estado} />
          </span>
          <span className="text-[11.5px] text-[var(--ink-soft)]">{orden.fecha}</span>
        </FilaTabla>
      ))}
    </TablaAdmin>
  )
}
