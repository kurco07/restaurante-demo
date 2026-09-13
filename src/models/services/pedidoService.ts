import { supabase } from '../../lib/supabaseClient'

export async function fetchPedidos(sesionMesaId: string) {
  const { data, error } = await supabase
    .from('pedidos_items')
    .select('*')
    .eq('sesion_mesa_id', sesionMesaId)
    .order('creado_en')

  if (error) throw error
  return data
}

export async function crearPedidoItem(item: {
  sesion_mesa_id: string
  menu_item_id: string
  cantidad: number
  precio_unitario: number
  notas?: string
}) {
  const { data, error } = await supabase
    .from('pedidos_items')
    .insert(item)
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
