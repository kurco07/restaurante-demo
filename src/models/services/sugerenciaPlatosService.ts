import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'
import type { PlatoAprobado, PlatosSugeridosHoy, ResultadoGenerarCompra, SugerenciaPlatos } from '../types'

// Platos a preparar (Fase 6, Módulo 3). Generar corre en la Edge Function
// ia-sugerir-platos; aprobar es una función de la base (migración 0022)
// que valida rol y estado; rechazar usa rechazar_sugerencia_ia (0021).

export async function generarSugerenciaPlatos(sedeId: string): Promise<ResultadoGenerarCompra> {
  const { data, error } = await supabase.functions.invoke<ResultadoGenerarCompra>('ia-sugerir-platos', {
    method: 'POST',
    body: { sedeId },
  })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const cuerpo = (await error.context.json().catch(() => null)) as ResultadoGenerarCompra | null
      if (cuerpo && !cuerpo.ok) return cuerpo
    }
    return { ok: false, mensaje: 'No se pudo llamar a la función de sugerencias. ¿Está desplegada en Supabase?' }
  }
  return data ?? { ok: false, mensaje: 'La función de sugerencias no devolvió respuesta.' }
}

interface FilaSugerencia {
  id: string
  estado: SugerenciaPlatos['estado']
  generada_en: string
  revisada_en: string | null
  contenido: {
    resumen?: string
    modelo?: string
    items?: SugerenciaPlatos['items']
    sin_stock?: SugerenciaPlatos['sin_stock']
    aprobado?: { items?: { plato: string; porciones: number }[] }
    rechazo?: { motivo?: string }
  }
  usuarios: { nombre: string } | null
}

// Las últimas sugerencias de platos de una sede
export async function fetchSugerenciasPlatos(sedeId: string, limite = 10): Promise<SugerenciaPlatos[]> {
  const { data, error } = await supabase
    .from('sugerencias_ia')
    .select('id, estado, generada_en, revisada_en, contenido, usuarios!revisada_por(nombre)')
    .eq('tipo', 'plato_a_preparar')
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
    sin_stock: f.contenido.sin_stock ?? [],
    aprobados: f.contenido.aprobado?.items ?? [],
    motivoRechazo: f.contenido.rechazo?.motivo ?? null,
  }))
}

export async function aprobarSugerenciaPlatos(id: string, items: PlatoAprobado[]) {
  const { error } = await supabase.rpc('aprobar_sugerencia_platos', { p_sugerencia_id: id, p_items: items })
  if (error) throw error
}

// Lo que ve cocina: la lista aprobada hoy para su sede, sin precios. Nulo
// si todavía no hay ninguna.
export async function fetchPlatosSugeridosHoy(): Promise<PlatosSugeridosHoy | null> {
  const { data, error } = await supabase.rpc('platos_sugeridos_hoy')
  if (error) throw error
  return (data as PlatosSugeridosHoy | null) ?? null
}
