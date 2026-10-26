// ============================================================
// Fase 6, Módulo 1 — Probar la conexión con el proveedor de IA
// ============================================================
// Hace una pregunta mínima al modelo y dice si respondió, con qué modelo
// y en cuánto tiempo. No manda ningún dato del restaurante ni guarda
// nada: sirve para comprobar que la clave y el modelo configurados
// funcionan antes de usar las sugerencias (Módulos 2 a 4).
//
// Solo gerencia y administración: son quienes van a revisar sugerencias.
//
// Los errores de la IA (clave inválida, cuota agotada…) vuelven con
// status 200 y ok: false, para que la app pueda mostrar el motivo; los de
// sesión o permisos, con 401/403.
import { autenticar, configIA, CORS, responder } from '../_shared/http.ts'
import { ErrorIA, obtenerProveedorIA, type ProveedorIA } from '../_shared/ia/index.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const sesion = await autenticar(req, ['gerencia', 'administracion'])
  if (sesion instanceof Response) return sesion

  const inicio = Date.now()
  let ia: ProveedorIA | null = null
  try {
    ia = obtenerProveedorIA(configIA())
    const r = await ia.generarJSON<{ respuesta: string }>({
      instrucciones: 'Eres una prueba de conexión. Responde solo con el JSON pedido.',
      mensaje: 'Responde con {"respuesta": "ok"}.',
      esquema: {
        type: 'object',
        properties: { respuesta: { type: 'string' } },
        required: ['respuesta'],
      },
      temperatura: 0,
    })

    return responder({
      ok: true,
      proveedor: r.proveedor,
      modelo: r.modelo,
      milisegundos: Date.now() - inicio,
      respuesta: r.datos.respuesta,
    })
  } catch (e) {
    if (e instanceof ErrorIA) {
      // Si el modelo no existe o no responde a tiempo, se listan los que sí
      // puede usar esta clave para poder elegir otro en GEMINI_MODELO
      let modelosDisponibles: string[] | undefined
      if ((e.codigo === 'modelo_no_encontrado' || e.codigo === 'tiempo_agotado') && ia) {
        modelosDisponibles = await ia.listarModelos().catch(() => undefined)
      }
      return responder({
        ok: false,
        codigo: e.codigo,
        mensaje: e.message,
        modelosDisponibles,
        milisegundos: Date.now() - inicio,
      })
    }
    console.error(e)
    return responder({ ok: false, codigo: 'desconocido', mensaje: 'Error inesperado en la función de IA.' }, 500)
  }
})
