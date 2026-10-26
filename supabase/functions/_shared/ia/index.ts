import { crearGemini } from './gemini.ts'
import { ErrorIA, type ProveedorIA } from './proveedor.ts'

export * from './proveedor.ts'

// Modelo por defecto si no se configura GEMINI_MODELO. Es un alias que
// Google mantiene apuntando a su "flash-lite" vigente: los nombres fijos
// (gemini-2.5-flash-lite, gemini-2.5-flash) dejaron de servir para claves
// nuevas, y gemini-flash-latest no respondía en 60 s en el nivel gratuito
// (prueba del 2026-10-26). Si cambia, la prueba de conexión lo dice y
// lista los modelos disponibles: se cambia el secreto, no el código.
export const MODELO_GEMINI_POR_DEFECTO = 'gemini-flash-lite-latest'

// Configuración que viene de los secretos de Supabase. Se pasa como
// objeto (y no se lee aquí con Deno.env) para poder probarlo con Node.
export interface ConfigIA {
  IA_PROVEEDOR?: string
  GEMINI_API_KEY?: string
  GEMINI_MODELO?: string
}

// Elige el adaptador según IA_PROVEEDOR (por ahora solo 'gemini').
// Agregar otro proveedor = un archivo nuevo junto a gemini.ts y un case
// aquí.
export function obtenerProveedorIA(config: ConfigIA, fetchFn?: typeof fetch, esperaMaximaMs?: number): ProveedorIA {
  const nombre = (config.IA_PROVEEDOR || 'gemini').toLowerCase()

  switch (nombre) {
    case 'gemini': {
      if (!config.GEMINI_API_KEY) {
        throw new ErrorIA(
          'no_configurada',
          'La IA no está configurada: falta el secreto GEMINI_API_KEY en Supabase (Edge Functions → Secrets).',
        )
      }
      return crearGemini({
        clave: config.GEMINI_API_KEY,
        modelo: config.GEMINI_MODELO || MODELO_GEMINI_POR_DEFECTO,
        fetch: fetchFn,
        esperaMaximaMs,
      })
    }
    default:
      throw new ErrorIA('no_configurada', `El proveedor de IA "${nombre}" no existe. Revisa el secreto IA_PROVEEDOR.`)
  }
}
