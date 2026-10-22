import { supabase } from '../../lib/supabaseClient'
import type { DiaHistorial, ReporteDiario } from '../types'

// Reporte de un día (migración 0018). dia en 'YYYY-MM-DD'; sin dia, el
// servidor usa hoy en la zona horaria de la sede. El supervisor solo
// puede pedir hoy y siempre recibe su propia sede: lo decide el servidor,
// no esta llamada. Requiere conexión, como todos los reportes.
export async function fetchReporteDiario(dia?: string, sedeId?: string) {
  const { data, error } = await supabase.rpc('reporte_diario', {
    p_dia: dia ?? null,
    p_sede_id: sedeId ?? null,
  })
  if (error) throw error
  return data as ReporteDiario
}

// Totales día por día entre desde y hasta (ambos incluidos), solo gerencia
export async function fetchHistorialDiario(desde: string, hasta: string, sedeId?: string) {
  const { data, error } = await supabase.rpc('reporte_diario_historial', {
    p_desde: desde,
    p_hasta: hasta,
    p_sede_id: sedeId ?? null,
  })
  if (error) throw error
  return data as DiaHistorial[]
}
