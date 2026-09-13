import { supabase } from '../../lib/supabaseClient'

export async function fetchInsumos(sedeId: string) {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('sede_id', sedeId)
    .order('nombre')

  if (error) throw error
  return data
}

export async function actualizarStock(insumoId: string, nuevoStock: number) {
  const { data, error } = await supabase
    .from('insumos')
    .update({ stock_actual: nuevoStock })
    .eq('id', insumoId)
    .select()
    .single()

  if (error) throw error
  return data
}
