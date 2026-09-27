import type { EstadoOrdenCompra } from '../../../../../models/types'
import { EstadoChip } from '../panel/EstadoChip'

const chipPorEstado: Record<EstadoOrdenCompra, { tono: 'verde' | 'naranja' | 'rojo' | 'gris'; label: string }> = {
  borrador: { tono: 'gris', label: 'Borrador' },
  pendiente: { tono: 'naranja', label: 'Pendiente' },
  aprobada: { tono: 'verde', label: 'Aprobada' },
  rechazada: { tono: 'rojo', label: 'Rechazada' },
  recibida: { tono: 'verde', label: 'Recibida' },
}

export function EstadoOrdenChip({ estado }: { estado: EstadoOrdenCompra }) {
  const chip = chipPorEstado[estado]
  return <EstadoChip tono={chip.tono}>{chip.label}</EstadoChip>
}
