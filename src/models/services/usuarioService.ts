import { supabase } from '../../lib/supabaseClient'

export async function fetchUsuarios(tenantId: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nombre')

  if (error) throw error
  return data
}
