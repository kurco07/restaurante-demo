import { supabase } from '../../lib/supabaseClient'
import type { CategoriaMenu, MenuItem, MenuItemSede, Receta } from '../types'

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

export async function actualizarCategoria(id: string, nombre: string) {
  const { data, error } = await supabase
    .from('categorias_menu')
    .update({ nombre })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as CategoriaMenu
}

// menu_items.categoria_id no permite borrar una categoría con platos
// asociados (on delete restrict) — el error de Postgres ya es bastante
// claro, se lo pasamos al usuario tal cual en vez de adivinar el motivo.
export async function eliminarCategoria(id: string) {
  const { error } = await supabase.from('categorias_menu').delete().eq('id', id)
  if (error) throw error
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

export async function actualizarMenuItem(
  id: string,
  cambios: {
    categoria_id: string
    nombre: string
    descripcion?: string
    precio_base: number
  },
) {
  const { data, error } = await supabase
    .from('menu_items')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as MenuItem
}

// pedidos_items.menu_item_id no permite borrar un plato con pedidos ya
// hechos — de nuevo, se propaga el error de Postgres tal cual.
export async function eliminarMenuItem(id: string) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw error
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

// Disponibilidad y precio de un plato en una sede (menu_item_sede). Sin
// fila = disponible a precio_base; por eso el upsert sobre
// unique(menu_item_id, sede_id) en vez de exigir que la fila exista.
export async function fetchMenuItemSede(menuItemId: string, sedeId: string) {
  const { data, error } = await supabase
    .from('menu_item_sede')
    .select('*')
    .eq('menu_item_id', menuItemId)
    .eq('sede_id', sedeId)
    .maybeSingle()

  if (error) throw error
  return data as MenuItemSede | null
}

export async function guardarMenuItemSede(fila: {
  tenant_id: string
  menu_item_id: string
  sede_id: string
  disponible: boolean
  precio_override: number | null
}) {
  const { data, error } = await supabase
    .from('menu_item_sede')
    .upsert(fila, { onConflict: 'menu_item_id,sede_id' })
    .select()
    .single()

  if (error) throw error
  return data as MenuItemSede
}
