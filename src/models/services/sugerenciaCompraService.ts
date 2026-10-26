import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'
import type { ItemAprobadoCompra, ResultadoGenerarCompra, SugerenciaCompra } from '../types'

// Sugerencias de compra de la IA (Fase 6, Módulo 2). Generar corre en la
// Edge Function ia-sugerir-compras; aprobar y rechazar son funciones de
// la base (migración 0021) que validan rol y estado. Todo requiere
// conexión: administración no es un módulo offline.

export async function generarSugerenciaCompra(): Promise<ResultadoGenerarCompra> {
  const { data, error } = await supabase.functions.invoke<ResultadoGenerarCompra>('ia-sugerir-compras', {
    method: 'POST',
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
  estado: SugerenciaCompra['estado']
  generada_en: string
  revisada_en: string | null
  contenido: {
    dias?: number
    resumen?: string
    modelo?: string
    items?: SugerenciaCompra['items']
    aprobado?: { ordenes?: string[] }
    rechazo?: { motivo?: string }
  }
  usuarios: { nombre: string } | null
}

// Las últimas sugerencias de compra de la sede (RLS: solo del restaurante)
export async function fetchSugerenciasCompra(sedeId: string, limite = 15): Promise<SugerenciaCompra[]> {
  const { data, error } = await supabase
    .from('sugerencias_ia')
    .select('id, estado, generada_en, revisada_en, contenido, usuarios!revisada_por(nombre)')
    .eq('tipo', 'compra')
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
    dias: f.contenido.dias ?? 7,
    resumen: f.contenido.resumen ?? '',
    modelo: f.contenido.modelo ?? '',
    items: f.contenido.items ?? [],
    ordenesCreadas: f.contenido.aprobado?.ordenes?.length ?? 0,
    motivoRechazo: f.contenido.rechazo?.motivo ?? null,
  }))
}

// Crea un borrador de orden por proveedor (creada_por nulo = IA) y marca
// la sugerencia como aprobada. Devuelve cuántos borradores se crearon.
export async function aprobarSugerenciaCompra(id: string, items: ItemAprobadoCompra[]) {
  const { data, error } = await supabase.rpc('aprobar_sugerencia_compra', { p_sugerencia_id: id, p_items: items })
  if (error) throw error
  return ((data as { ordenes?: string[] } | null)?.ordenes ?? []).length
}

export async function rechazarSugerencia(id: string, motivo: string) {
  const { error } = await supabase.rpc('rechazar_sugerencia_ia', { p_sugerencia_id: id, p_motivo: motivo })
  if (error) throw error
}
