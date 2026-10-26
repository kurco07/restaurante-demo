import { ErrorIA, type EsquemaJSON, type PeticionIA, type ProveedorIA, type RespuestaIA } from './proveedor.ts'

// Adaptador de Google Gemini (API REST de generateContent). Elegido para
// pruebas por su nivel gratuito sin tarjeta (arquitectura.md §4.5).
// Para producción se decide un modelo económico aparte.

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
// Los modelos "flash" recientes razonan antes de responder y en el nivel
// gratuito pueden tardar: 60 s de margen (las Edge Functions aguantan más)
const ESPERA_MAXIMA_MS = 60_000

interface OpcionesGemini {
  clave: string
  modelo: string
  // Se pueden reemplazar en las pruebas
  fetch?: typeof fetch
  esperaMaximaMs?: number
}

// Gemini espera los tipos en mayúsculas (OBJECT, STRING…) en su
// responseSchema
function aEsquemaGemini(e: EsquemaJSON): Record<string, unknown> {
  const salida: Record<string, unknown> = { type: e.type.toUpperCase() }
  if (e.description) salida.description = e.description
  if (e.enum) salida.enum = e.enum
  if (e.required) salida.required = e.required
  if (e.items) salida.items = aEsquemaGemini(e.items)
  if (e.properties) {
    salida.properties = Object.fromEntries(Object.entries(e.properties).map(([k, v]) => [k, aEsquemaGemini(v)]))
  }
  return salida
}

interface RespuestaGemini {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  promptFeedback?: { blockReason?: string }
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  error?: { code?: number; message?: string; status?: string }
}

function errorPorEstado(status: number, cuerpo: RespuestaGemini, modelo: string): ErrorIA {
  const detalle = cuerpo.error?.message ?? ''
  if (status === 400 && /api key/i.test(detalle)) {
    return new ErrorIA('clave_invalida', 'La clave de Gemini no es válida. Revisa el secreto GEMINI_API_KEY en Supabase.')
  }
  if (status === 401 || status === 403) {
    return new ErrorIA('clave_invalida', 'Gemini rechazó la clave (sin permiso). Revisa el secreto GEMINI_API_KEY en Supabase.')
  }
  if (status === 404) {
    // El detalle de Gemini distingue "no existe" de "ya no está disponible
    // para claves nuevas" (modelos que siguen en la lista pero no se pueden
    // usar): se muestra tal cual
    return new ErrorIA(
      'modelo_no_encontrado',
      `Gemini no puede usar el modelo "${modelo}"${detalle ? ` (Gemini dice: ${detalle})` : ''}. Revisa el secreto GEMINI_MODELO.`,
    )
  }
  if (status === 429) {
    return new ErrorIA('cuota_agotada', 'Se agotó el límite del nivel gratuito de Gemini por ahora. Prueba de nuevo en unos minutos.')
  }
  return new ErrorIA('desconocido', `Gemini respondió con un error (${status})${detalle ? `: ${detalle}` : ''}.`)
}

interface ListaModelosGemini {
  models?: { name?: string; supportedGenerationMethods?: string[] }[]
  nextPageToken?: string
}

export function crearGemini({
  clave,
  modelo,
  fetch: fetchFn = fetch,
  esperaMaximaMs = ESPERA_MAXIMA_MS,
}: OpcionesGemini): ProveedorIA {
  return {
    nombre: 'gemini',
    modelo,
    async listarModelos() {
      const nombres: string[] = []
      let pagina: string | undefined
      do {
        const url = `${URL_BASE}?pageSize=100${pagina ? `&pageToken=${encodeURIComponent(pagina)}` : ''}`
        let respuesta: Response
        try {
          respuesta = await fetchFn(url, { headers: { 'x-goog-api-key': clave } })
        } catch {
          throw new ErrorIA('sin_conexion', 'No se pudo conectar con Gemini para listar los modelos.')
        }
        const cuerpo = (await respuesta.json().catch(() => ({}))) as ListaModelosGemini & RespuestaGemini
        if (!respuesta.ok) throw errorPorEstado(respuesta.status, cuerpo, modelo)
        for (const m of cuerpo.models ?? []) {
          // Solo los que sirven para generateContent; el nombre viene como
          // "models/gemini-…" y GEMINI_MODELO va sin el prefijo
          if (m.name && m.supportedGenerationMethods?.includes('generateContent')) {
            nombres.push(m.name.replace(/^models\//, ''))
          }
        }
        pagina = cuerpo.nextPageToken
      } while (pagina)
      return nombres
    },
    async generarJSON<T>(p: PeticionIA): Promise<RespuestaIA<T>> {
      const controlador = new AbortController()
      const temporizador = setTimeout(() => controlador.abort(), esperaMaximaMs)

      let respuesta: Response
      try {
        respuesta = await fetchFn(`${URL_BASE}/${encodeURIComponent(modelo)}:generateContent`, {
          method: 'POST',
          // La clave va en un encabezado, no en la URL, para que no quede
          // en registros de acceso
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: p.instrucciones }] },
            contents: [{ role: 'user', parts: [{ text: p.mensaje }] }],
            generationConfig: {
              temperature: p.temperatura ?? 0.2,
              responseMimeType: 'application/json',
              responseSchema: aEsquemaGemini(p.esquema),
            },
          }),
          signal: controlador.signal,
        })
      } catch (e) {
        if (controlador.signal.aborted) {
          throw new ErrorIA(
            'tiempo_agotado',
            `Gemini (${modelo}) no respondió en ${Math.round(esperaMaximaMs / 1000)} segundos. Puede estar saturado: prueba de nuevo, o usa un modelo más liviano en GEMINI_MODELO.`,
          )
        }
        throw new ErrorIA(
          'sin_conexion',
          `No se pudo conectar con Gemini${e instanceof Error && e.message ? ` (${e.message})` : ''}.`,
        )
      } finally {
        clearTimeout(temporizador)
      }

      const cuerpo = (await respuesta.json().catch(() => ({}))) as RespuestaGemini
      if (!respuesta.ok) throw errorPorEstado(respuesta.status, cuerpo, modelo)

      if (cuerpo.promptFeedback?.blockReason) {
        throw new ErrorIA('bloqueada', `Gemini bloqueó la petición (${cuerpo.promptFeedback.blockReason}).`)
      }
      const candidato = cuerpo.candidates?.[0]
      const texto = candidato?.content?.parts?.map((parte) => parte.text ?? '').join('') ?? ''
      if (!texto) {
        throw new ErrorIA('bloqueada', `Gemini no devolvió respuesta${candidato?.finishReason ? ` (${candidato.finishReason})` : ''}.`)
      }

      let datos: T
      try {
        datos = JSON.parse(texto) as T
      } catch {
        throw new ErrorIA('respuesta_invalida', 'Gemini devolvió algo que no es JSON válido.')
      }

      return {
        datos,
        proveedor: 'gemini',
        modelo,
        tokensEntrada: cuerpo.usageMetadata?.promptTokenCount ?? null,
        tokensSalida: cuerpo.usageMetadata?.candidatesTokenCount ?? null,
      }
    },
  }
}
