import type { OrdenCompraConDetalle } from '../../../../../models/services/compraService'
import { totalOrden } from '../../../../../controllers/administracion/useCompras'
import { formatearMoneda } from '../../../../components/ui/constants'
import { FilaTabla, TablaAdmin } from '../comunes'
import { EstadoOrdenChip } from './EstadoOrdenChip'

interface TablaOrdenesProps {
  ordenes: OrdenCompraConDetalle[]
  totalMes: number
  seleccionadaId: string | undefined
  onSeleccionar: (id: string) => void
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
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
          <span className="text-[11.5px] text-[var(--ink-soft)]">{formatearFecha(orden.creado_en)}</span>
        </FilaTabla>
      ))}
      {ordenes.length === 0 && (
        <div className="px-[18px] py-6 text-center text-[13px] text-[var(--ink-soft)]">
          No hay órdenes de compra en este filtro.
        </div>
      )}
    </TablaAdmin>
  )
}
