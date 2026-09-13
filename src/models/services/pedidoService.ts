import { supabase } from '../../lib/supabaseClient'

export async function fetchPedidos(sesionId: string) {
  const { data, error } = await supabase
    .from('pedidos_items')
    .select('*')
    .eq('sesion_id', sesionId)
    .order('creado_en')

  if (error) throw error
  return data
}

export async function crearPedidoItem(item: {
  tenant_id: string
  sede_id: string
  sesion_id: string
  menu_item_id: string
  cantidad: number
  precio_unitario: number
  notas?: string
  agregado_por?: string
}) {
  const { data, error } = await supabase
    .from('pedidos_items')
    .insert({ ...item, client_local_id: crypto.randomUUID() })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function actualizarEstadoPedido(id: string, estado: string) {
  const { data, error } = await supabase
    .from('pedidos_items')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
