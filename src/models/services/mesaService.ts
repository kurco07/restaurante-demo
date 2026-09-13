import { supabase } from '../../lib/supabaseClient'

export async function fetchMesas(sedeId: string) {
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .eq('sede_id', sedeId)
    .order('nombre_numero')

  if (error) throw error
  return data
}

export async function abrirSesionMesa(params: {
  tenantId: string
  sedeId: string
  mesaId: string
  mesoneroId?: string
}) {
  const { data, error } = await supabase
    .from('sesiones_mesa')
    .insert({
      tenant_id: params.tenantId,
      sede_id: params.sedeId,
      mesa_id: params.mesaId,
      mesonero_id: params.mesoneroId,
      origen: 'mesonero',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cerrarSesionMesa(sesionId: string) {
  const { data, error } = await supabase
    .from('sesiones_mesa')
    .update({ estado: 'cerrada', cerrada_en: new Date().toISOString() })
    .eq('id', sesionId)
    .select()
    .single()

  if (error) throw error
  return data
}
