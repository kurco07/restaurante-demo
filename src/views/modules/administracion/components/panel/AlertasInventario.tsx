import type { AlertaInventario } from '../../../../../models/types'
import { EstadoChip } from './EstadoChip'
import { PanelCard } from '../../../../components/ui/PanelCard'

interface AlertasInventarioProps {
  alertas: AlertaInventario[]
}

export function AlertasInventario({ alertas }: AlertasInventarioProps) {
  return (
    <PanelCard
      titulo="Alertas de inventario"
      subtitulo="Productos con bajo stock"
      enlace={{ label: 'Ir a inventario', to: '/proximamente' }}
    >
      <div className="divide-y divide-[var(--border)]">
        {alertas.map((alerta) => (
          <div key={alerta.id} className="flex items-center justify-between gap-2.5 py-2.5 first:pt-0.5">
            <div>
              <div className="text-[13px] font-semibold">{alerta.nombre}</div>
              <div className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">
                Quedan {alerta.cantidad} {alerta.unidad}
              </div>
            </div>
            <EstadoChip tono="rojo">Bajo stock</EstadoChip>
          </div>
        ))}
      </div>
    </PanelCard>
  )
}
