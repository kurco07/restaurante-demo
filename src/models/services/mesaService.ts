import { supabase } from '../../lib/supabaseClient'

export async function fetchMesas(sedeId: string) {
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .eq('sede_id', sedeId)
    .order('numero')

  if (error) throw error
  return data
}

export async function abrirSesionMesa(mesaId: string, mesoneroId?: string) {
  const { data, error } = await supabase
    .from('sesiones_mesa')
    .insert({ mesa_id: mesaId, mesonero_id: mesoneroId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cerrarSesionMesa(sesionId: string) {
  const { data, error } = await supabase
    .from('sesiones_mesa')
    .update({ estado: 'cerrada', cerrado_en: new Date().toISOString() })
    .eq('id', sesionId)
    .select()
    .single()

  if (error) throw error
  return data
}
