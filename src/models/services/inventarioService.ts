import { supabase } from '../../lib/supabaseClient'
import type { InventarioSede, Insumo } from '../types'

// insumos es el catálogo por tenant (qué existe), sin cantidad — eso vive
// en inventario_sede (cuánto hay en cada sede). Ver docs/modelo-de-datos.md.
export async function fetchInsumos(tenantId: string) {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nombre')

  if (error) throw error
  return data as Insumo[]
}

// Crear un insumo también crea su fila en inventario_sede (en 0) para la
// sede de quien lo crea — así el trigger de descuento automático
// (migración 0008) siempre tiene dónde escribir, incluso antes de
// registrar el primer lote o la primera compra.
export async function crearInsumo(insumo: {
  tenant_id: string
  sede_id: string
  nombre: string
  unidad_de_medida: string
  tipo: Insumo['tipo']
}) {
  const { data, error } = await supabase
    .from('insumos')
    .insert({
      tenant_id: insumo.tenant_id,
      nombre: insumo.nombre,
      unidad_de_medida: insumo.unidad_de_medida,
      tipo: insumo.tipo,
    })
    .select()
    .single()

  if (error) throw error
  const nuevoInsumo = data as Insumo

  const { error: errorInventario } = await supabase.from('inventario_sede').insert({
    tenant_id: insumo.tenant_id,
    sede_id: insumo.sede_id,
    insumo_id: nuevoInsumo.id,
    cantidad_actual: 0,
  })
  if (errorInventario) throw errorInventario

  return nuevoInsumo
}

export async function actualizarInsumo(
  id: string,
  cambios: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] },
) {
  const { data, error } = await supabase.from('insumos').update(cambios).eq('id', id).select().single()
  if (error) throw error
  return data as Insumo
}

// insumos.id lo referencian recetas (on delete restrict) e
// inventario_sede/lotes_insumo/movimientos_inventario (on delete
// cascade) — si está en uso en una receta, Postgres rechaza el borrado
// y se propaga el error tal cual, mismo patrón que menuService.
export async function eliminarInsumo(id: string) {
  const { error } = await supabase.from('insumos').delete().eq('id', id)
  if (error) throw error
}

export async function fetchInventarioSede(tenantId: string, sedeId: string) {
  const { data, error } = await supabase
    .from('inventario_sede')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('sede_id', sedeId)

  if (error) throw error
  return data as InventarioSede[]
}

export async function actualizarStockMinimo(inventarioSedeId: string, stockMinimo: number | null) {
  const { data, error } = await supabase
    .from('inventario_sede')
    .update({ stock_minimo: stockMinimo })
    .eq('id', inventarioSedeId)
    .select()
    .single()

  if (error) throw error
  return data as InventarioSede
}

// Recuento manual completo (ej. conteo físico) — fija el total, a
// diferencia de los movimientos de la Fase 4 Módulo 4 que suman/restan.
export async function actualizarStock(params: {
  tenantId: string
  sedeId: string
  insumoId: string
  nuevaCantidad: number
}) {
  const { data, error } = await supabase
    .from('inventario_sede')
    .upsert(
      {
        tenant_id: params.tenantId,
        sede_id: params.sedeId,
        insumo_id: params.insumoId,
        cantidad_actual: params.nuevaCantidad,
      },
      { onConflict: 'sede_id,insumo_id' },
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// Nombres de los platos que usan este insumo en su receta — para el
// chip "Usado en N recetas" del editor. No hay columna de relación
// directa insumo↔plato, se deriva uniendo por recetas.
export async function fetchPlatosPorInsumo(insumoId: string) {
  const { data, error } = await supabase
    .from('recetas')
    .select('menu_items(nombre)')
    .eq('insumo_id', insumoId)

  if (error) throw error
  return (data as unknown as { menu_items: { nombre: string } | null }[])
    .map((fila) => fila.menu_items?.nombre)
    .filter((nombre): nombre is string => Boolean(nombre))
}
