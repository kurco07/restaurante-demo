import { supabase } from '../../lib/supabaseClient'
import type { CategoriaMenu, MenuItem, Receta } from '../types'

export async function fetchCategorias(tenantId: string) {
  const { data, error } = await supabase
    .from('categorias_menu')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('orden')

  if (error) throw error
  return data as CategoriaMenu[]
}

export async function crearCategoria(tenantId: string, nombre: string, orden: number) {
  const { data, error } = await supabase
    .from('categorias_menu')
    .insert({ tenant_id: tenantId, nombre, orden })
    .select()
    .single()

  if (error) throw error
  return data as CategoriaMenu
}

export async function fetchMenuItems(tenantId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nombre')

  if (error) throw error
  return data as MenuItem[]
}

export async function crearMenuItem(item: {
  tenant_id: string
  categoria_id: string
  nombre: string
  descripcion?: string
  precio_base: number
  imagen_url?: string
}) {
  const { data, error } = await supabase.from('menu_items').insert(item).select().single()

  if (error) throw error
  return data as MenuItem
}

export async function fetchRecetaPorMenuItem(menuItemId: string) {
  const { data, error } = await supabase
    .from('recetas')
    .select('*')
    .eq('menu_item_id', menuItemId)

  if (error) throw error
  return data as Receta[]
}

export async function agregarRecetaItem(item: {
  tenant_id: string
  menu_item_id: string
  insumo_id: string
  cantidad_requerida: number
  unidad: string
}) {
  const { data, error } = await supabase.from('recetas').insert(item).select().single()

  if (error) throw error
  return data as Receta
}

export async function eliminarRecetaItem(id: string) {
  const { error } = await supabase.from('recetas').delete().eq('id', id)
  if (error) throw error
}
