import { useMemo, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { usePowerSyncWatch } from '../usePowerSyncWatch'
import { avanzarItemsDeSesion } from '../../models/services/pedidoService'

export type EstadoItemCocina = 'pendiente' | 'en_preparacion' | 'listo'

export interface ItemCocina {
  id: string
  cantidad: number
  notas: string | null
  estado: EstadoItemCocina
  creadoEn: string
  menuItemId: string
  plato: string
  sesionId: string
  mesa: string
  mesonero: string | null
}

export interface TicketCocina {
  sesionId: string
  estado: EstadoItemCocina
  mesa: string
  mesonero: string | null
  creadoEn: string
  items: ItemCocina[]
}

// pedidos_items.estado es por ítem, no por "ticket" — así que se agrupan
// acá los ítems de una misma mesa que comparten estado, para que cocina
// vea "Mesa 1: 2× Hamburguesa, 1× Papas" como una sola tarjeta (igual que
// el boceto), en vez de una tarjeta por plato. Si una mesa tiene ítems en
// distintos estados (unos en espera, otros en preparación), aparece en
// más de una columna — eso sí es real. "entregado" no se muestra: ya
// salió de cocina. "por_aprobar" tampoco: es un pedido de autopedido que
// todavía no confirmó ningún mesonero, cocina no debe verlo aún.
const SQL = `
  select
    pi.id as id,
    pi.cantidad as cantidad,
    pi.notas as notas,
    pi.estado as estado,
    pi.creado_en as creadoEn,
    pi.menu_item_id as menuItemId,
    mi.nombre as plato,
    sm.id as sesionId,
    m.nombre_numero as mesa,
    u.nombre as mesonero
  from pedidos_items pi
  join menu_items mi on mi.id = pi.menu_item_id
  join sesiones_mesa sm on sm.id = pi.sesion_id
  join mesas m on m.id = sm.mesa_id
  left join usuarios u on u.id = sm.mesonero_id
  where pi.tenant_id = ? and pi.sede_id = ? and pi.estado not in ('por_aprobar', 'entregado')
  order by pi.creado_en
`

export const SIGUIENTE_ESTADO: Record<EstadoItemCocina, 'en_preparacion' | 'listo' | 'entregado'> = {
  pendiente: 'en_preparacion',
  en_preparacion: 'listo',
  listo: 'entregado',
}

export const ETIQUETA_ESTADO: Record<EstadoItemCocina, string> = {
  pendiente: 'En espera',
  en_preparacion: 'En preparación',
  listo: 'Listo',
}

export const ACCION_SEGUN_ESTADO: Record<EstadoItemCocina, string> = {
  pendiente: 'Iniciar preparación',
  en_preparacion: 'Marcar listo',
  listo: 'Entregar',
}

type Filtro = 'todos' | EstadoItemCocina

function agruparEnTickets(items: ItemCocina[]): TicketCocina[] {
  const grupos = new Map<string, TicketCocina>()
  for (const item of items) {
    const key = `${item.sesionId}::${item.estado}`
    const existente = grupos.get(key)
    if (existente) {
      existente.items.push(item)
      if (item.creadoEn < existente.creadoEn) existente.creadoEn = item.creadoEn
    } else {
      grupos.set(key, {
        sesionId: item.sesionId,
        estado: item.estado,
        mesa: item.mesa,
        mesonero: item.mesonero,
        creadoEn: item.creadoEn,
        items: [item],
      })
    }
  }
  return [...grupos.values()].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
}

export function useCocina() {
  const { usuario } = useUsuario()
  const items = usePowerSyncWatch<ItemCocina>(SQL, [usuario?.tenant_id ?? '', usuario?.sede_id ?? ''])
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [avanzandoId, setAvanzandoId] = useState<string | null>(null)

  const tickets = useMemo(() => agruparEnTickets(items), [items])

  const ticketsFiltrados = useMemo(
    () => (filtro === 'todos' ? tickets : tickets.filter((t) => t.estado === filtro)),
    [tickets, filtro],
  )

  const contador = (f: Filtro) => (f === 'todos' ? tickets.length : tickets.filter((t) => t.estado === f).length)

  const resumen = useMemo(() => {
    const totales = new Map<string, number>()
    for (const item of items) {
      totales.set(item.plato, (totales.get(item.plato) ?? 0) + item.cantidad)
    }
    return [...totales.entries()].sort((a, b) => b[1] - a[1])
  }, [items])

  async function avanzarEstado(ticket: TicketCocina) {
    setAvanzandoId(ticket.sesionId + ticket.estado)
    try {
      await avanzarItemsDeSesion(ticket.sesionId, ticket.estado, SIGUIENTE_ESTADO[ticket.estado])
    } finally {
      setAvanzandoId(null)
    }
  }

  return { tickets: ticketsFiltrados, filtro, setFiltro, contador, resumen, avanzarEstado, avanzandoId }
}
