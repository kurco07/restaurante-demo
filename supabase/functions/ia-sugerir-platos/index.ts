// ============================================================
// Fase 6, Módulo 3 — Generar la sugerencia de platos a preparar hoy
// ============================================================
// Lo llama gerencia con el botón "Generar" para UNA sede (body:
// { sedeId }). A mano, para el día, una pendiente a la vez por sede
// (decisiones de Pedro, 2026-10-26).
//
// 1. Pide a la base los números de cada plato de esa sede
//    (datos_platos_preparar, migración 0022).
// 2. Le pasa a la IA los que se pueden preparar, sin nombres de personas,
//    para que elija hasta 8, con porciones y motivo.
// 3. Valida la respuesta (armarSugerenciaPlatos) y la guarda en
//    sugerencias_ia como 'pendiente'. Cocina la ve recién cuando gerencia
//    la aprueba (aprobar_sugerencia_platos / platos_sugeridos_hoy).
//
// Todo con la sesión de quien llama, a través de RLS.
import { autenticar, configIA, CORS, responder } from '../_shared/http.ts'
import { ErrorIA, obtenerProveedorIA } from '../_shared/ia/index.ts'
import { armarSugerenciaPlatos, peticionPlatos, platosCandidatos, type DatoPlato } from '../_shared/platos.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const sesion = await autenticar(req, ['gerencia'])
  if (sesion instanceof Response) return sesion
  const { supabase, perfil } = sesion

  const cuerpo = (await req.json().catch(() => ({}))) as { sedeId?: string }
  const sedeId = cuerpo.sedeId ?? perfil.sede_id
  if (!sedeId) return responder({ ok: false, mensaje: 'Elige una sede para generar la sugerencia.' }, 400)

  // La sede tiene que ser del restaurante (RLS de sedes)
  const { data: sede } = await supabase.from('sedes').select('id, nombre').eq('id', sedeId).maybeSingle()
  if (!sede) return responder({ ok: false, mensaje: 'Esa sede no existe en tu restaurante.' }, 403)

  const { count: pendientes } = await supabase
    .from('sugerencias_ia')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'plato_a_preparar')
    .eq('sede_id', sedeId)
    .eq('estado', 'pendiente')
  if (pendientes) {
    return responder({
      ok: false,
      codigo: 'ya_pendiente',
      mensaje: `Ya hay una sugerencia de platos pendiente para ${sede.nombre}. Apruébala o recházala antes de generar otra.`,
    })
  }

  const { data, error } = await supabase.rpc('datos_platos_preparar', { p_sede_id: sedeId })
  if (error) {
    console.error(error)
    return responder({ ok: false, mensaje: 'No se pudieron leer el stock, las ventas y las recetas de la sede.' }, 500)
  }

  const datos = (data ?? []) as DatoPlato[]
  const candidatos = platosCandidatos(datos)
  if (candidatos.length === 0) {
    return responder({
      ok: true,
      sugerenciaId: null,
      mensaje: 'No hay platos con receta y stock para preparar en esta sede.',
    })
  }

  let sugerencia
  let modelo = ''
  try {
    const ia = obtenerProveedorIA(configIA())
    const r = await ia.generarJSON(peticionPlatos(candidatos))
    sugerencia = armarSugerenciaPlatos(datos, candidatos, r.datos)
    modelo = `${r.proveedor} · ${r.modelo}`
  } catch (e) {
    if (e instanceof ErrorIA) return responder({ ok: false, codigo: e.codigo, mensaje: e.message })
    console.error(e)
    return responder({ ok: false, mensaje: 'Error inesperado al generar la sugerencia.' }, 500)
  }

  if (sugerencia.items.length === 0) {
    return responder({ ok: false, codigo: 'respuesta_invalida', mensaje: 'La IA no devolvió ningún plato válido. Prueba de nuevo.' })
  }

  const { data: fila, error: errorInsert } = await supabase
    .from('sugerencias_ia')
    .insert({
      tenant_id: perfil.tenant_id,
      sede_id: sedeId,
      tipo: 'plato_a_preparar',
      contenido: { ...sugerencia, modelo, sede: sede.nombre },
    })
    .select('id')
    .single()
  if (errorInsert || !fila) {
    console.error(errorInsert)
    return responder({ ok: false, mensaje: 'La IA respondió, pero no se pudo guardar la sugerencia.' }, 500)
  }

  return responder({ ok: true, sugerenciaId: fila.id, items: sugerencia.items.length })
})
