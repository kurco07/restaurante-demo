import { useMemo, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { usePowerSyncWatch } from '../usePowerSyncWatch'
import { aprobarPedidoAutopedido } from '../../models/services/pedidoService'

interface ItemPorAprobar {
  id: string
  cantidad: number
  notas: string | null
  creadoEn: string
  plato: string
}

export interface TicketPorAprobar {
  sesionId: string
  mesa: string
  creadoEn: string
  items: ItemPorAprobar[]
}

// Pedidos de autopedido que todavía no confirmó ningún mesonero — "para
// cualquier mesonero disponible de la sede", no asignado a uno en
// particular (decisión confirmada con el usuario). Se agrupan por mesa
// igual que el tablero de cocina.
const SQL = `
  select
    pi.id as id,
    pi.cantidad as cantidad,
    pi.notas as notas,
    pi.creado_en as creadoEn,
    mi.nombre as plato,
    sm.id as sesionId,
    m.nombre_numero as mesa
  from pedidos_items pi
  join menu_items mi on mi.id = pi.menu_item_id
  join sesiones_mesa sm on sm.id = pi.sesion_id
  join mesas m on m.id = sm.mesa_id
  where pi.tenant_id = ? and pi.sede_id = ? and pi.estado = 'por_aprobar'
  order by pi.creado_en
`

export function usePorAprobar() {
  const { usuario } = useUsuario()
  const items = usePowerSyncWatch<ItemPorAprobar & { sesionId: string; mesa: string }>(SQL, [
    usuario?.tenant_id ?? '',
    usuario?.sede_id ?? '',
  ])
  const [aprobandoId, setAprobandoId] = useState<string | null>(null)

  const tickets = useMemo(() => {
    const grupos = new Map<string, TicketPorAprobar>()
    for (const item of items) {
      const existente = grupos.get(item.sesionId)
      if (existente) {
        existente.items.push(item)
        if (item.creadoEn < existente.creadoEn) existente.creadoEn = item.creadoEn
      } else {
        grupos.set(item.sesionId, { sesionId: item.sesionId, mesa: item.mesa, creadoEn: item.creadoEn, items: [item] })
      }
    }
    return [...grupos.values()].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
  }, [items])

  async function aprobar(ticket: TicketPorAprobar) {
    if (!usuario) return
    setAprobandoId(ticket.sesionId)
    try {
      await aprobarPedidoAutopedido(ticket.sesionId, usuario.id)
    } finally {
      setAprobandoId(null)
    }
  }

  return { tickets, aprobar, aprobandoId }
}
