import { usePowerSyncWatch } from '../usePowerSyncWatch'
import type { Usuario } from '../../models/types'

export type EstadoItemMesonero = 'por_aprobar' | 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'anulado'

export interface ItemMisPedidos {
  id: string
  mesa_id: string
  mesa: string
  plato: string | null
  cantidad: number
  notas: string | null
  estado: EstadoItemMesonero
}

// Lo ya enviado a cocina en las mesas abiertas del mesonero, con su estado.
// Lectura reactiva local (PowerSync): cuando cocina marca "listo", aparece
// solo, también sin internet si el cambio ya llegó al dispositivo.
export function useMisPedidos(usuario: Usuario) {
  const items = usePowerSyncWatch<ItemMisPedidos>(
    `select pi.id, m.id as mesa_id, m.nombre_numero as mesa, mi.nombre as plato,
            pi.cantidad, pi.notas, pi.estado
       from pedidos_items pi
       join sesiones_mesa sm on sm.id = pi.sesion_id
       join mesas m on m.id = sm.mesa_id
       left join menu_items mi on mi.id = pi.menu_item_id
      where sm.mesonero_id = ? and sm.estado = 'abierta'
      order by pi.creado_en`,
    [usuario.id],
  )

  // Platos que cocina ya terminó y el mesonero tiene que ir a buscar
  const listos = items.filter((i) => i.estado === 'listo').reduce((s, i) => s + i.cantidad, 0)

  return { items, listos }
}
