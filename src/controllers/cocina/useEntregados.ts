import { useMemo } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { usePowerSyncWatch } from '../usePowerSyncWatch'

interface ItemEntregado {
  id: string
  cantidad: number
  notas: string | null
  creadoEn: string
  plato: string
  sesionId: string
  mesa: string
  mesonero: string | null
}

export interface PedidoEntregado {
  sesionId: string
  mesa: string
  mesonero: string | null
  // Hora del plato más reciente del grupo. pedidos_items no guarda cuándo
  // se entregó, solo cuándo se pidió.
  pedidoEn: string
  items: ItemEntregado[]
}

// Lo más reciente primero; el límite evita traer el historial completo a la
// pantalla. El filtro "de hoy" se hace en JS porque la fecha viene como
// texto de Postgres y compararla en SQLite depende de su formato.
const SQL = `
  select
    pi.id as id,
    pi.cantidad as cantidad,
    pi.notas as notas,
    pi.creado_en as creadoEn,
    mi.nombre as plato,
    sm.id as sesionId,
    m.nombre_numero as mesa,
    u.nombre as mesonero
  from pedidos_items pi
  join menu_items mi on mi.id = pi.menu_item_id
  join sesiones_mesa sm on sm.id = pi.sesion_id
  join mesas m on m.id = sm.mesa_id
  left join usuarios u on u.id = sm.mesonero_id
  where pi.tenant_id = ? and pi.sede_id = ? and pi.estado = 'entregado'
  order by pi.creado_en desc
  limit 500
`

function inicioDeHoy() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
}

// Platos que ya salieron de cocina hoy, agrupados por mesa (sesión), para
// responder "¿ya salió lo de la mesa 4?". Lectura local, funciona offline.
export function useEntregados() {
  const { usuario } = useUsuario()
  const items = usePowerSyncWatch<ItemEntregado>(SQL, [usuario?.tenant_id ?? '', usuario?.sede_id ?? ''])

  return useMemo(() => {
    const desde = inicioDeHoy()
    const grupos = new Map<string, PedidoEntregado>()
    for (const item of items) {
      if (new Date(item.creadoEn).getTime() < desde) continue
      const grupo = grupos.get(item.sesionId)
      if (grupo) {
        grupo.items.push(item)
      } else {
        grupos.set(item.sesionId, {
          sesionId: item.sesionId,
          mesa: item.mesa,
          mesonero: item.mesonero,
          pedidoEn: item.creadoEn,
          items: [item],
        })
      }
    }
    const pedidos = [...grupos.values()]
    const platos = pedidos.reduce((s, p) => s + p.items.reduce((t, i) => t + i.cantidad, 0), 0)
    return { pedidos, platos }
  }, [items])
}
