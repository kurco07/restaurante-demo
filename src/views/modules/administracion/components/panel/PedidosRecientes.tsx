import type { EstadoPedidoReciente, PedidoReciente } from '../../../../../models/types'
import { formatearMoneda } from '../../../../components/ui/constants'
import { EstadoChip } from './EstadoChip'
import { PanelCard } from '../../../../components/ui/PanelCard'

interface PedidosRecientesProps {
  pedidos: PedidoReciente[]
}

const chipPorEstado: Record<EstadoPedidoReciente, { tono: 'verde' | 'naranja' | 'rojo'; label: string }> = {
  entregado: { tono: 'verde', label: 'Entregado' },
  listo: { tono: 'verde', label: 'Listo' },
  cocina: { tono: 'naranja', label: 'En cocina' },
  cancelado: { tono: 'rojo', label: 'Cancelado' },
}

export function PedidosRecientes({ pedidos }: PedidosRecientesProps) {
  return (
    <PanelCard
      titulo="Pedidos recientes"
      subtitulo="Últimos pedidos de todas las mesas"
      enlace={{ label: 'Ver todos', to: '/administracion/pedidos' }}
    >
      <div className="divide-y divide-[var(--border)]">
        {pedidos.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2.5 py-3 first:pt-0.5">
            <div className="flex items-center gap-3">
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--orange-bg)] text-[12.5px] font-extrabold text-[var(--orange-dark)]">
                {p.mesaNumero}
              </div>
              <div>
                <div className="text-[13.5px] font-bold">Mesa {p.mesaNumero}</div>
                <div className="text-[11.5px] text-[var(--ink-soft)]">
                  {p.items} {p.items === 1 ? 'ítem' : 'ítems'} · {p.mesonero}
                </div>
              </div>
            </div>
            <div className="text-right">
              <EstadoChip tono={chipPorEstado[p.estado].tono}>{chipPorEstado[p.estado].label}</EstadoChip>
              <div className="mt-[3px] text-[11px] text-[var(--ink-soft)]">
                {formatearMoneda(p.total)} · {p.horaLabel}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  )
}
