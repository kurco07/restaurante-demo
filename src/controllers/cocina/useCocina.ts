import { useMemo, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { usePowerSyncWatch } from '../usePowerSyncWatch'
import { cambiarEstadoPedidoItem } from '../../models/services/pedidoService'

export type EstadoItemCocina = 'pendiente' | 'en_preparacion' | 'listo'

export interface ItemCocina {
  id: string
  cantidad: number
  notas: string | null
  estado: EstadoItemCocina
  creadoEn: string
  menuItemId: string
  plato: string
  mesa: string
  mesonero: string | null
}

// pedidos_items.estado es por ítem, no por "ticket" — a diferencia del
// mock anterior (una orden con varios platos y un solo estado), cada
// tarjeta del tablero es un ítem individual. "entregado" no se muestra:
// ya salió de cocina.
const SQL = `
  select
    pi.id as id,
    pi.cantidad as cantidad,
    pi.notas as notas,
    pi.estado as estado,
    pi.creado_en as creadoEn,
    pi.menu_item_id as menuItemId,
    mi.nombre as plato,
    m.nombre_numero as mesa,
    u.nombre as mesonero
  from pedidos_items pi
  join menu_items mi on mi.id = pi.menu_item_id
  join sesiones_mesa sm on sm.id = pi.sesion_id
  join mesas m on m.id = sm.mesa_id
  left join usuarios u on u.id = sm.mesonero_id
  where pi.tenant_id = ? and pi.sede_id = ? and pi.estado != 'entregado'
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

export function useCocina() {
  const { usuario } = useUsuario()
  const items = usePowerSyncWatch<ItemCocina>(SQL, [usuario?.tenant_id ?? '', usuario?.sede_id ?? ''])
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [avanzandoId, setAvanzandoId] = useState<string | null>(null)

  const itemsFiltrados = useMemo(
    () => (filtro === 'todos' ? items : items.filter((i) => i.estado === filtro)),
    [items, filtro],
  )

  const contador = (f: Filtro) => (f === 'todos' ? items.length : items.filter((i) => i.estado === f).length)

  const resumen = useMemo(() => {
    const totales = new Map<string, number>()
    for (const item of items) {
      totales.set(item.plato, (totales.get(item.plato) ?? 0) + item.cantidad)
    }
    return [...totales.entries()].sort((a, b) => b[1] - a[1])
  }, [items])

  async function avanzarEstado(item: ItemCocina) {
    setAvanzandoId(item.id)
    try {
      await cambiarEstadoPedidoItem(item.id, SIGUIENTE_ESTADO[item.estado])
    } finally {
      setAvanzandoId(null)
    }
  }

  return { items: itemsFiltrados, filtro, setFiltro, contador, resumen, avanzarEstado, avanzandoId }
}
