import { supabase } from '../../lib/supabaseClient'
import type { Mesa } from '../types'

// CRUD online para el editor de administración — a diferencia de
// sesiones_mesa/pedidos_items, administración no necesita funcionar
// offline, así que esto escribe directo a Supabase (mismo patrón que
// menuService.ts) en vez de pasar por PowerSync.

export async function fetchMesas(tenantId: string, sedeId: string) {
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('sede_id', sedeId)
    .order('nombre_numero')

  if (error) throw error
  return data as Mesa[]
}

export async function crearMesa(mesa: {
  tenant_id: string
  sede_id: string
  nombre_numero: string
  posicion_x: number | null
  posicion_y: number | null
}) {
  const { data, error } = await supabase
    .from('mesas')
    .insert({ ...mesa, estado: 'libre' })
    .select()
    .single()

  if (error) throw error
  return data as Mesa
}

export async function actualizarMesa(
  id: string,
  cambios: Partial<Pick<Mesa, 'nombre_numero' | 'posicion_x' | 'posicion_y' | 'estado'>>,
) {
  const { data, error } = await supabase.from('mesas').update(cambios).eq('id', id).select().single()

  if (error) throw error
  return data as Mesa
}

// sesiones_mesa.mesa_id es on delete cascade — borrar una mesa borra
// también su historial de sesiones (y, en cadena, sus pedidos_items).
export async function eliminarMesa(id: string) {
  const { error } = await supabase.from('mesas').delete().eq('id', id)
  if (error) throw error
}
