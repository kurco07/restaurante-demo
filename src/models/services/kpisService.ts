import { supabase } from '../../lib/supabaseClient'
import type { KpisVentas } from '../types'

// KPIs de ventas de un período, agregados en el servidor por la función
// kpis_ventas (migración 0010). Corre con los permisos de quien llama:
// RLS decide qué sedes entran. sedeId opcional filtra a una sola sede.
// Los reportes de gerencia requieren conexión (arquitectura.md §1).
export async function fetchKpisVentas(desde: Date, hasta: Date, sedeId?: string) {
  const { data, error } = await supabase.rpc('kpis_ventas', {
    p_desde: desde.toISOString(),
    p_hasta: hasta.toISOString(),
    p_sede_id: sedeId ?? null,
  })
  if (error) throw error
  return data as KpisVentas
}
