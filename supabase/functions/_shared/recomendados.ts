import type { EsquemaJSON, PeticionIA } from './ia/proveedor.ts'
import type { DatoPlato } from './platos.ts'

// ============================================================
// Fase 6, Módulo 4 — Recomendados del día: qué se le pide a la IA y cómo
// se valida lo que contesta
// ============================================================
// Los números son los mismos de los platos a preparar
// (datos_platos_preparar, 0022). La IA elige de 3 a MAX_RECOMENDADOS
// platos para OFRECER (buen margen, insumos por vencer, con stock) y
// escribe una frase corta para que el mesonero lo ofrezca y el cliente la
// lea en el menú (decisión de Pedro, 2026-10-28). Gerencia la puede editar
// antes de aprobar. armarRecomendados descarta platos inventados,
// repetidos o con poco stock, y frases que hablen de costos o márgenes.

export const MAX_RECOMENDADOS = 5
// No se recomienda algo que se acaba enseguida
export const MIN_PORCIONES = 5
export const MAX_FRASE = 140

export interface Recomendado {
  menu_item_id: string
  plato: string
  frase: string // la ve el mesonero y el cliente
  motivo: string // solo para gerencia
  porciones_posibles: number | null
  margen: number | null
  margen_pct: number | null
  por_vencer: { insumo: string; dias: number }[]
}

export interface SugerenciaRecomendados {
  resumen: string
  items: Recomendado[]
}

interface RespuestaIARecomendados {
  resumen?: unknown
  items?: { ref?: unknown; frase?: unknown; motivo?: unknown }[]
}

const ESQUEMA: EsquemaJSON = {
  type: 'object',
  properties: {
    resumen: { type: 'string', description: 'Una frase para gerencia' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'La ref del plato, tal cual' },
          frase: { type: 'string', description: 'Para el cliente: corta, apetitosa, sin precios ni costos' },
          motivo: { type: 'string', description: 'Para gerencia: por qué se eligió, con los números' },
        },
        required: ['ref', 'frase', 'motivo'],
      },
    },
  },
  required: ['resumen', 'items'],
}

// Una frase para el cliente no puede hablar de plata del negocio
const PALABRAS_PROHIBIDAS = /\b(margen|costo|coste|ganancia|rentab|vence|vencer|vencimiento|stock|inventario)\w*/i

export function recomendablesCandidatos(datos: DatoPlato[]) {
  return datos.filter((d) => d.porciones_posibles == null || Number(d.porciones_posibles) >= MIN_PORCIONES)
}

export function peticionRecomendados(candidatos: DatoPlato[]): PeticionIA {
  const datos = candidatos.map((d, i) => ({
    ref: `r${i + 1}`,
    plato: d.plato,
    porciones_que_alcanzan: d.porciones_posibles,
    se_vende_este_dia: Number(d.ventas_esperadas),
    margen_por_plato: d.margen == null ? null : Number(d.margen),
    margen_pct: d.margen_pct == null ? null : Number(d.margen_pct),
    insumos_por_vencer: d.por_vencer,
  }))

  return {
    instrucciones: [
      'Eres el asistente comercial de un restaurante. Eliges los platos que los mesoneros deben recomendar hoy y que se destacan en el menú del cliente.',
      `Elige entre 3 y ${MAX_RECOMENDADOS} platos de la lista. Prioriza: 1) los que usan insumos por vencer; 2) buen margen; 3) que tengan stock de sobra.`,
      'Para cada uno escribe:',
      `- frase: para el CLIENTE, en español, de máximo ${MAX_FRASE} caracteres, apetitosa y basada solo en el nombre del plato. Nunca menciones precios, costos, márgenes, stock ni que algo vence. No inventes ingredientes.`,
      '- motivo: para la GERENCIA, una frase corta con los números que justifican la elección.',
      'Usa solo las ref de la lista.',
    ].join('\n'),
    mensaje: `Platos que se pueden recomendar hoy (JSON):\n${JSON.stringify(datos)}`,
    esquema: ESQUEMA,
    temperatura: 0.5,
  }
}

export function armarRecomendados(candidatos: DatoPlato[], respuesta: unknown): SugerenciaRecomendados {
  const r = (respuesta ?? {}) as RespuestaIARecomendados
  const porRef = new Map(candidatos.map((d, i) => [`r${i + 1}`, d]))
  const vistos = new Set<string>()
  const items: Recomendado[] = []

  for (const item of Array.isArray(r.items) ? r.items : []) {
    if (items.length >= MAX_RECOMENDADOS) break
    const ref = String(item.ref ?? '')
    const d = porRef.get(ref)
    if (!d || vistos.has(ref)) continue
    vistos.add(ref)

    // Sin frase usable (vacía o hablando de plata/stock), queda una neutra
    // que gerencia puede reescribir antes de aprobar
    const propia = typeof item.frase === 'string' ? item.frase.trim() : ''
    const frase = propia && !PALABRAS_PROHIBIDAS.test(propia) ? propia.slice(0, MAX_FRASE) : `Hoy te recomendamos ${d.plato}.`

    items.push({
      menu_item_id: d.menu_item_id,
      plato: d.plato,
      frase,
      motivo: typeof item.motivo === 'string' ? item.motivo.trim().slice(0, 240) : '',
      porciones_posibles: d.porciones_posibles,
      margen: d.margen,
      margen_pct: d.margen_pct,
      por_vencer: d.por_vencer,
    })
  }

  return { resumen: typeof r.resumen === 'string' ? r.resumen.trim().slice(0, 400) : '', items }
}
