import { supabase } from '../../lib/supabaseClient'
import type { LoteInsumo } from '../types'

export async function fetchLotesPorInsumo(tenantId: string, sedeId: string, insumoId: string) {
  const { data, error } = await supabase
    .from('lotes_insumo')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('sede_id', sedeId)
    .eq('insumo_id', insumoId)
    .order('abierto_en', { ascending: false })

  if (error) throw error
  return data as LoteInsumo[]
}

// Registrar un lote es una entrada de inventario: crea el lote y suma la
// cantidad inicial al total de la sede en la misma operación — el total
// de inventario_sede siempre debe reflejar la suma de lotes abiertos
// para un insumo 'por_lote'.
export async function registrarLote(datos: {
  tenant_id: string
  sede_id: string
  insumo_id: string
  cantidad_inicial: number
  fecha_vencimiento: string | null
}) {
  const { data, error } = await supabase
    .from('lotes_insumo')
    .insert({
      tenant_id: datos.tenant_id,
      sede_id: datos.sede_id,
      insumo_id: datos.insumo_id,
      cantidad_inicial: datos.cantidad_inicial,
      cantidad_restante: datos.cantidad_inicial,
      fecha_vencimiento: datos.fecha_vencimiento,
    })
    .select()
    .single()

  if (error) throw error
  const nuevoLote = data as LoteInsumo

  const { error: errorInventario } = await supabase.rpc('incrementar_inventario_sede', {
    p_sede_id: datos.sede_id,
    p_insumo_id: datos.insumo_id,
    p_cantidad: datos.cantidad_inicial,
  })
  if (errorInventario) throw errorInventario

  return nuevoLote
}
