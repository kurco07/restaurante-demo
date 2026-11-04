import { supabase } from '../../lib/supabaseClient'
import type { SedeConfig } from '../types/administracion'

const CAMPOS = 'nombre, direccion, telefono, horario, impuesto_porcentaje, propina_sugerida_pct, notif_stock_bajo, notif_pedidos_demorados, notif_resumen_diario'

// Configuración de la sede propia (migración 0034: lectura abierta al
// tenant, escritura solo administracion/gerencia/super_admin). La fila
// de sedes siempre existe (se crea en el aprovisionamiento), a
// diferencia de personalizacion_marca.
export async function fetchSedePropia(sedeId: string): Promise<SedeConfig> {
  const { data, error } = await supabase.from('sedes').select(CAMPOS).eq('id', sedeId).single()
  if (error) throw error
  return data as SedeConfig
}

export async function actualizarSedePropia(sedeId: string, cambios: Partial<SedeConfig>) {
  const { error } = await supabase.from('sedes').update(cambios).eq('id', sedeId)
  if (error) throw error
}
