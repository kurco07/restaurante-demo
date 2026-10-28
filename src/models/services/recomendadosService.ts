import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'
import type { RecomendadoAprobado, RecomendadosHoy, ResultadoGenerarCompra, SugerenciaRecomendados } from '../types'

// Recomendados del día (Fase 6, Módulo 4). Generar corre en la Edge
// Function ia-sugerir-recomendados; aprobar y leer son funciones de la
// base (migración 0023). Rechazar usa rechazar_sugerencia_ia (0021).

export async function generarRecomendados(sedeId: string): Promise<ResultadoGenerarCompra> {
  const { data, error } = await supabase.functions.invoke<ResultadoGenerarCompra>('ia-sugerir-recomendados', {
    method: 'POST',
    body: { sedeId },
  })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const cuerpo = (await error.context.json().catch(() => null)) as ResultadoGenerarCompra | null
      if (cuerpo && !cuerpo.ok) return cuerpo
    }
    return { ok: false, mensaje: 'No se pudo llamar a la función de recomendados. ¿Está desplegada en Supabase?' }
  }
  return data ?? { ok: false, mensaje: 'La función de recomendados no devolvió respuesta.' }
}

interface FilaSugerencia {
  id: string
  estado: SugerenciaRecomendados['estado']
  generada_en: string
  revisada_en: string | null
  contenido: {
    resumen?: string
    modelo?: string
    items?: SugerenciaRecomendados['items']
    aprobado?: { items?: { plato: string; frase: string }[] }
    rechazo?: { motivo?: string }
  }
  usuarios: { nombre: string } | null
}

export async function fetchSugerenciasRecomendados(sedeId: string, limite = 10): Promise<SugerenciaRecomendados[]> {
  const { data, error } = await supabase
    .from('sugerencias_ia')
    .select('id, estado, generada_en, revisada_en, contenido, usuarios!revisada_por(nombre)')
    .eq('tipo', 'recomendado_del_dia')
    .eq('sede_id', sedeId)
    .order('generada_en', { ascending: false })
    .limit(limite)
  if (error) throw error

  return (data as unknown as FilaSugerencia[]).map((f) => ({
    id: f.id,
    estado: f.estado,
    generada_en: f.generada_en,
    revisada_en: f.revisada_en,
    revisada_por: f.usuarios?.nombre ?? null,
    resumen: f.contenido.resumen ?? '',
    modelo: f.contenido.modelo ?? '',
    items: f.contenido.items ?? [],
    aprobados: f.contenido.aprobado?.items ?? [],
    motivoRechazo: f.contenido.rechazo?.motivo ?? null,
  }))
}

export async function aprobarRecomendados(id: string, items: RecomendadoAprobado[]) {
  const { error } = await supabase.rpc('aprobar_sugerencia_recomendados', { p_sugerencia_id: id, p_items: items })
  if (error) throw error
}

// Mesonero: los de su sede, aprobados hoy. Nulo si no hay.
export async function fetchRecomendadosHoy(): Promise<RecomendadosHoy | null> {
  const { data, error } = await supabase.rpc('recomendados_hoy')
  if (error) throw error
  return (data as RecomendadosHoy | null) ?? null
}

// Cliente por QR (sin sesión): los de la sede de esa mesa
export async function fetchRecomendadosMesa(mesaId: string): Promise<RecomendadosHoy | null> {
  const { data, error } = await supabase.rpc('recomendados_mesa', { p_mesa_id: mesaId })
  if (error) throw error
  return (data as RecomendadosHoy | null) ?? null
}
