import { supabase } from '../../lib/supabaseClient'
import type { KpisVentas, RentabilidadPlato, RotacionInsumo } from '../types'

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

// Rotación de inventario por insumo en el período, calculada en el
// servidor por kpis_inventario (migración 0011) desde los movimientos de
// inventario de la Fase 4. Mismos permisos y filtro de sede que arriba.
export async function fetchKpisInventario(desde: Date, hasta: Date, sedeId?: string) {
  const { data, error } = await supabase.rpc('kpis_inventario', {
    p_desde: desde.toISOString(),
    p_hasta: hasta.toISOString(),
    p_sede_id: sedeId ?? null,
  })
  if (error) throw error
  return data as RotacionInsumo[]
}

// Rentabilidad por plato del período (migración 0012): costo de la receta
// con la última compra recibida de cada insumo, contra el precio cobrado.
export async function fetchKpisRentabilidad(desde: Date, hasta: Date, sedeId?: string) {
  const { data, error } = await supabase.rpc('kpis_rentabilidad', {
    p_desde: desde.toISOString(),
    p_hasta: hasta.toISOString(),
    p_sede_id: sedeId ?? null,
  })
  if (error) throw error
  return data as RentabilidadPlato[]
}

// Para los platos con "Costo incompleto": qué insumos de su receta nunca
// tuvieron una compra recibida (no aparecen en costo_insumo_actual).
// Devuelve { menu_item_id: [nombres de insumo] }.
export async function fetchInsumosSinCompra(menuItemIds: string[]) {
  if (menuItemIds.length === 0) return {}

  const [recetas, costos] = await Promise.all([
    supabase.from('recetas').select('menu_item_id, insumo_id, insumos(nombre)').in('menu_item_id', menuItemIds),
    supabase.from('costo_insumo_actual').select('insumo_id'),
  ])
  if (recetas.error) throw recetas.error
  if (costos.error) throw costos.error

  const conCosto = new Set((costos.data as { insumo_id: string }[]).map((c) => c.insumo_id))
  const faltantes: Record<string, string[]> = {}
  for (const r of recetas.data as unknown as { menu_item_id: string; insumo_id: string; insumos: { nombre: string } | null }[]) {
    if (conCosto.has(r.insumo_id)) continue
    ;(faltantes[r.menu_item_id] ??= []).push(r.insumos?.nombre ?? 'insumo')
  }
  return faltantes
}
