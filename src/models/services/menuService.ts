import { supabase } from '../../lib/supabaseClient'

export async function fetchMenuItems(tenantId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nombre')

  if (error) throw error
  return data
}

export async function fetchCategorias(tenantId: string) {
  const { data, error } = await supabase
    .from('categorias_menu')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('orden')

  if (error) throw error
  return data
}
