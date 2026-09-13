import { supabase } from '../../lib/supabaseClient'

// insumos es el catálogo por tenant (qué existe), sin cantidad — eso vive
// en inventario_sede (cuánto hay en cada sede). Ver docs/modelo-de-datos.md.
export async function fetchInsumos(tenantId: string) {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nombre')

  if (error) throw error
  return data
}

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
