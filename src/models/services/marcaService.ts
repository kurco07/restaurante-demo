import { supabase } from '../../lib/supabaseClient'
import type { Marca } from '../types/marca'

// Personalización de marca del tenant propio (migración 0025: lectura
// abierta a todo el tenant, escritura solo administracion/gerencia). La
// fila puede no existir todavía (tenants creados antes de la Fase 7, o
// que nunca guardaron nada) — null es un resultado válido, no un error.
export async function fetchMarcaPropia(): Promise<Marca | null> {
  const { data, error } = await supabase
    .from('personalizacion_marca')
    .select('logo_url, color_primario, color_secundario, nombre_mostrado')
    .maybeSingle()
  if (error) throw error
  return data
}

// Upsert por tenant_id (único): la fila puede no existir aún para
// tenants creados antes de esta fase.
export async function guardarMarcaPropia(tenantId: string, cambios: Partial<Marca>) {
  const { error } = await supabase
    .from('personalizacion_marca')
    .upsert({ tenant_id: tenantId, ...cambios }, { onConflict: 'tenant_id' })
  if (error) throw error
}

// Sube el logo al bucket público `marca`, en marca/<tenant_id>/logo.<ext>
// (migración 0025: la política de Storage exige que ese primer segmento
// de la ruta sea el tenant de quien escribe). Siempre el mismo nombre de
// archivo por tenant — un logo nuevo reemplaza al anterior.
export async function subirLogoMarca(tenantId: string, archivo: File): Promise<string> {
  const extension = archivo.name.split('.').pop() ?? 'png'
  const ruta = `${tenantId}/logo.${extension}`
  const { error } = await supabase.storage.from('marca').upload(ruta, archivo, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('marca').getPublicUrl(ruta)
  return data.publicUrl
}
