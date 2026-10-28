import { supabase } from '../../lib/supabaseClient'

export const MODULOS_OPCIONALES = [
  'ia_sugerencias_compra',
  'ia_sugerencias_platos',
  'ia_recomendados',
  'alertas_gerencia',
  'multi_sede',
  'realidad_aumentada',
] as const

export type ModuloOpcional = (typeof MODULOS_OPCIONALES)[number]

// Interruptores por restaurante (Fase 7, Módulo 5, migración 0029). Sin
// filas todavía (tenants de antes de este módulo) se trata como todo
// prendido — mismo criterio que el backfill de la migración, para no
// romper nada que ya estuviera funcionando.
export async function fetchModulosActivos(): Promise<Set<ModuloOpcional>> {
  const { data, error } = await supabase.from('tenant_modulos').select('modulo, activo')
  if (error) throw error
  if (!data || data.length === 0) return new Set(MODULOS_OPCIONALES)
  return new Set(data.filter((f) => f.activo).map((f) => f.modulo as ModuloOpcional))
}
