import { supabase } from '../../lib/supabaseClient'
import type { PedidoAdmin } from '../types'

interface FilaPedidoAdmin {
  sesion_id: string
  mesa_numero: string
  mesonero_nombre: string
  items: { nombre: string; cantidad: number; precio_unitario: number }[]
  total: number
  estado: PedidoAdmin['estado']
  abierta_en: string
  cerrada_en: string | null
}

function horaLabel(fecha: string) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000))
  if (minutos < 60) return `hace ${minutos} min`
  return new Date(fecha).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' })
}

// Sesiones de mesa del día (con sus platos, mesonero y total), vía la
// función pedidos_admin_dia (migración 0033) — mismo patrón que
// fetchKpisVentas, security invoker: RLS decide qué sedes entran.
export async function fetchPedidosAdminDia(sedeId: string, desde: Date): Promise<PedidoAdmin[]> {
  const { data, error } = await supabase.rpc('pedidos_admin_dia', {
    p_sede_id: sedeId,
    p_desde: desde.toISOString(),
  })
  if (error) throw error

  return (data as FilaPedidoAdmin[]).map((f) => ({
    id: f.sesion_id,
    mesaNumero: f.mesa_numero,
    mesonero: f.mesonero_nombre,
    items: f.items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precioUnitario: i.precio_unitario })),
    total: f.total,
    estado: f.estado,
    horaLabel: horaLabel(f.cerrada_en ?? f.abierta_en),
  }))
}
