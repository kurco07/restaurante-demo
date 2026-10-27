// ============================================================
// Fase 6, Módulo 2 — Generar una sugerencia de compra con la IA
// ============================================================
// Lo llama administración con el botón "Generar sugerencias" (se generan
// a mano, para 7 días: decisión de Pedro, 2026-10-26).
//
// 1. Pide a la base los números de cada insumo de SU sede
//    (datos_sugerencia_compra, migración 0021).
// 2. Le pasa a la IA solo los que hace falta reponer, sin nombres de
//    personas, para que ajuste y explique.
// 3. Valida la respuesta (armarSugerencia) y la guarda en sugerencias_ia
//    como 'pendiente'. No crea ninguna orden: eso pasa recién cuando
//    administración la aprueba (aprobar_sugerencia_compra).
//
// Todo con la sesión de quien llama, a través de RLS.
import { autenticar, configIA, CORS, responder } from '../_shared/http.ts'
import { ErrorIA, obtenerProveedorIA } from '../_shared/ia/index.ts'
import { armarSugerencia, candidatosAComprar, peticionCompra, type CandidatoCompra } from '../_shared/compras.ts'

const DIAS = 7

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const sesion = await autenticar(req, ['administracion'])
  if (sesion instanceof Response) return sesion
  const { supabase, perfil } = sesion
  if (!perfil.sede_id) return responder({ ok: false, mensaje: 'Tu usuario no tiene una sede asignada.' }, 403)

  // Una sola pendiente por sede: si no, cada clic agrega otra igual a la
  // bandeja y gasta cuota de la IA
  const { count: pendientes } = await supabase
    .from('sugerencias_ia')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'compra')
    .eq('sede_id', perfil.sede_id)
    .eq('estado', 'pendiente')
  if (pendientes) {
    return responder({
      ok: false,
      codigo: 'ya_pendiente',
      mensaje: 'Ya hay una sugerencia de compra pendiente en esta sede. Apruébala o recházala antes de generar otra.',
    })
  }

  const { data, error } = await supabase.rpc('datos_sugerencia_compra', { p_sede_id: perfil.sede_id, p_dias: DIAS })
  if (error) {
    console.error(error)
    return responder({ ok: false, mensaje: 'No se pudieron leer el consumo y el stock de la sede.' }, 500)
  }

  const candidatos = candidatosAComprar((data ?? []) as CandidatoCompra[])
  if (candidatos.length === 0) {
    return responder({
      ok: true,
      sugerenciaId: null,
      mensaje: `No hace falta comprar nada para los próximos ${DIAS} días: el stock y lo ya pedido alcanzan.`,
    })
  }

  let sugerencia
  let modelo = ''
  try {
    const ia = obtenerProveedorIA(configIA())
    const r = await ia.generarJSON(peticionCompra(candidatos, DIAS))
    sugerencia = armarSugerencia(candidatos, r.datos, DIAS)
    modelo = `${r.proveedor} · ${r.modelo}`
  } catch (e) {
    if (e instanceof ErrorIA) return responder({ ok: false, codigo: e.codigo, mensaje: e.message })
    console.error(e)
    return responder({ ok: false, mensaje: 'Error inesperado al generar la sugerencia.' }, 500)
  }

  const { data: fila, error: errorInsert } = await supabase
    .from('sugerencias_ia')
    .insert({
      tenant_id: perfil.tenant_id,
      sede_id: perfil.sede_id,
      tipo: 'compra',
      contenido: { ...sugerencia, modelo },
    })
    .select('id')
    .single()
  if (errorInsert || !fila) {
    console.error(errorInsert)
    return responder({ ok: false, mensaje: 'La IA respondió, pero no se pudo guardar la sugerencia.' }, 500)
  }

  return responder({ ok: true, sugerenciaId: fila.id, items: sugerencia.items.length })
})
