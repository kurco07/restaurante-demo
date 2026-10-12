import { supabase } from '../../lib/supabaseClient'
import type { Proveedor } from '../types'

export async function fetchProveedores(tenantId: string) {
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nombre')

  if (error) throw error
  return data as Proveedor[]
}

export async function crearProveedor(datos: {
  tenant_id: string
  sede_id: string | null
  nombre: string
  contacto: string | null
}) {
  const { data, error } = await supabase.from('proveedores').insert(datos).select().single()
  if (error) throw error
  return data as Proveedor
}

export async function actualizarProveedor(id: string, cambios: { nombre: string; contacto: string | null }) {
  const { data, error } = await supabase.from('proveedores').update(cambios).eq('id', id).select().single()
  if (error) throw error
  return data as Proveedor
}

// ordenes_compra.proveedor_id lo referencia sin on delete — Postgres
// rechaza el borrado si el proveedor tiene órdenes asociadas, mismo
// patrón que insumos en recetas (se propaga el error tal cual).
export async function eliminarProveedor(id: string) {
  const { error } = await supabase.from('proveedores').delete().eq('id', id)
  if (error) throw error
}
