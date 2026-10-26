import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'
import type { ResultadoPruebaIA } from '../types'

// Prueba la conexión con el proveedor de IA (Edge Function ia-probar,
// Fase 6 Módulo 1). La IA corre en el servidor: la clave nunca pasa por
// el navegador. Requiere conexión, como todo lo de gerencia.
export async function probarIA(): Promise<ResultadoPruebaIA> {
  const { data, error } = await supabase.functions.invoke<ResultadoPruebaIA>('ia-probar', { method: 'POST' })
  if (error) {
    // 401/403/500: la función manda { ok: false, mensaje } en el cuerpo
    if (error instanceof FunctionsHttpError) {
      const cuerpo = (await error.context.json().catch(() => null)) as ResultadoPruebaIA | null
      if (cuerpo && !cuerpo.ok) return cuerpo
    }
    return { ok: false, mensaje: 'No se pudo llamar a la función de IA. ¿Está desplegada en Supabase?' }
  }
  return data ?? { ok: false, mensaje: 'La función de IA no devolvió respuesta.' }
}
