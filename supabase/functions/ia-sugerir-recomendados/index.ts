// ============================================================
// Fase 6, Módulo 4 — Generar los recomendados del día
// ============================================================
// Lo llama gerencia para UNA sede (body: { sedeId }), a mano, una
// pendiente a la vez por sede. Usa los mismos números que los platos a
// preparar (datos_platos_preparar, 0022); la IA elige 3 a 5 platos para
// ofrecer y escribe la frase que leen mesonero y cliente. Se guarda como
// 'pendiente': el menú no muestra nada hasta que gerencia aprueba
// (aprobar_sugerencia_recomendados, 0023). Con la sesión de quien llama.
import { autenticar, configIA, CORS, responder } from '../_shared/http.ts'
import { ErrorIA, obtenerProveedorIA } from '../_shared/ia/index.ts'
import type { DatoPlato } from '../_shared/platos.ts'
import { armarRecomendados, peticionRecomendados, recomendablesCandidatos } from '../_shared/recomendados.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const sesion = await autenticar(req, ['gerencia'])
  if (sesion instanceof Response) return sesion
  const { supabase, perfil } = sesion

  const cuerpo = (await req.json().catch(() => ({}))) as { sedeId?: string }
  const sedeId = cuerpo.sedeId ?? perfil.sede_id
  if (!sedeId) return responder({ ok: false, mensaje: 'Elige una sede para generar los recomendados.' }, 400)

  const { data: sede } = await supabase.from('sedes').select('id, nombre').eq('id', sedeId).maybeSingle()
  if (!sede) return responder({ ok: false, mensaje: 'Esa sede no existe en tu restaurante.' }, 403)

  const { count: pendientes } = await supabase
    .from('sugerencias_ia')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'recomendado_del_dia')
    .eq('sede_id', sedeId)
    .eq('estado', 'pendiente')
  if (pendientes) {
    return responder({
      ok: false,
      codigo: 'ya_pendiente',
      mensaje: `Ya hay recomendados pendientes para ${sede.nombre}. Apruébalos o recházalos antes de generar otros.`,
    })
  }

  const { data, error } = await supabase.rpc('datos_platos_preparar', { p_sede_id: sedeId })
  if (error) {
    console.error(error)
    return responder({ ok: false, mensaje: 'No se pudieron leer el stock, las ventas y las recetas de la sede.' }, 500)
  }

  const candidatos = recomendablesCandidatos((data ?? []) as DatoPlato[])
  if (candidatos.length === 0) {
    return responder({ ok: true, sugerenciaId: null, mensaje: 'No hay platos con stock suficiente para recomendar en esta sede.' })
  }

  let sugerencia
  let modelo = ''
  try {
    const ia = obtenerProveedorIA(configIA())
    const r = await ia.generarJSON(peticionRecomendados(candidatos))
    sugerencia = armarRecomendados(candidatos, r.datos)
    modelo = `${r.proveedor} · ${r.modelo}`
  } catch (e) {
    if (e instanceof ErrorIA) return responder({ ok: false, codigo: e.codigo, mensaje: e.message })
    console.error(e)
    return responder({ ok: false, mensaje: 'Error inesperado al generar los recomendados.' }, 500)
  }

  if (sugerencia.items.length === 0) {
    return responder({ ok: false, codigo: 'respuesta_invalida', mensaje: 'La IA no devolvió ningún plato válido. Prueba de nuevo.' })
  }

  const { data: fila, error: errorInsert } = await supabase
    .from('sugerencias_ia')
    .insert({
      tenant_id: perfil.tenant_id,
      sede_id: sedeId,
      tipo: 'recomendado_del_dia',
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
