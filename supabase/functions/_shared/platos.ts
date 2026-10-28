import type { EsquemaJSON, PeticionIA } from './ia/proveedor.ts'

// ============================================================
// Fase 6, Módulo 3 — Platos a preparar: qué se le pide a la IA y cómo se
// valida lo que contesta
// ============================================================
// Mismo esquema mixto que compras (compras.ts): la base calcula los
// números (datos_platos_preparar, migración 0022) y la IA elige hasta
// MAX_PLATOS platos, cuántas porciones y por qué, mirando stock,
// rentabilidad, ventas de ese día de la semana e insumos por vencer
// (decisión de Pedro, 2026-10-26). armarSugerenciaPlatos descarta platos
// inventados, repetidos o sin stock, y recorta las porciones: nunca más
// de las que alcanzan, ni muy por encima de lo que se suele vender.

export const MAX_PLATOS = 8
// Tope de porciones por plato: el doble de lo que se vende ese día, y al
// menos TOPE_MINIMO para no dejar en 0 un plato sin historial de ventas
export const TOPE_MINIMO = 10

// Una fila de datos_platos_preparar
export interface DatoPlato {
  menu_item_id: string
  plato: string
  porciones_posibles: number | null // null = sin límite de stock conocido
  insumo_limitante: string | null
  ventas_esperadas: number
  vendidos_28d: number
  precio: number
  costo: number | null
  costo_completo: boolean
  margen: number | null
  margen_pct: number | null
  por_vencer: { insumo: string; dias: number }[]
}

export interface PlatoSugerido {
  menu_item_id: string
  plato: string
  porciones: number
  motivo: string
  // Los números que se le mostraron a la IA, para que gerencia los vea
  porciones_posibles: number | null
  ventas_esperadas: number
  margen: number | null
  margen_pct: number | null
  por_vencer: { insumo: string; dias: number }[]
}

export interface SinStock {
  plato: string
  insumo_limitante: string | null
  ventas_esperadas: number
}

export interface SugerenciaPlatos {
  resumen: string
  items: PlatoSugerido[]
  // Platos que se suelen vender ese día pero hoy no alcanza el stock: se
  // calcula en la base, no lo decide la IA
  sin_stock: SinStock[]
}

interface RespuestaIAPlatos {
  resumen?: unknown
  items?: { ref?: unknown; porciones?: unknown; motivo?: unknown }[]
}

const ESQUEMA: EsquemaJSON = {
  type: 'object',
  properties: {
    resumen: { type: 'string', description: 'Una o dos frases para cocina y gerencia' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'La ref del plato, tal cual' },
          porciones: { type: 'integer' },
          motivo: { type: 'string', description: 'Una frase corta' },
        },
        required: ['ref', 'porciones', 'motivo'],
      },
    },
  },
  required: ['resumen', 'items'],
}

export function topePorciones(d: DatoPlato) {
  const porVentas = Math.max(TOPE_MINIMO, Math.ceil(Number(d.ventas_esperadas) * 2))
  return d.porciones_posibles == null ? porVentas : Math.min(Number(d.porciones_posibles), porVentas)
}

// Se le ofrecen a la IA los platos que se pueden preparar (con stock o
// sin límite conocido)
export function platosCandidatos(datos: DatoPlato[]) {
  return datos.filter((d) => d.porciones_posibles == null || Number(d.porciones_posibles) > 0)
}

export function platosSinStock(datos: DatoPlato[]): SinStock[] {
  return datos
    .filter((d) => d.porciones_posibles != null && Number(d.porciones_posibles) === 0 && Number(d.ventas_esperadas) >= 1)
    .sort((a, b) => Number(b.ventas_esperadas) - Number(a.ventas_esperadas))
    .map((d) => ({ plato: d.plato, insumo_limitante: d.insumo_limitante, ventas_esperadas: Number(d.ventas_esperadas) }))
}

export function peticionPlatos(candidatos: DatoPlato[]): PeticionIA {
  // Nombres de platos e insumos y cifras: nunca personas (§4.5)
  const datos = candidatos.map((d, i) => ({
    ref: `p${i + 1}`,
    plato: d.plato,
    porciones_que_alcanzan: d.porciones_posibles,
    tope_porciones: topePorciones(d),
    se_vende_este_dia: Number(d.ventas_esperadas),
    vendidos_28_dias: Number(d.vendidos_28d),
    margen_por_plato: d.margen == null ? null : Number(d.margen),
    margen_pct: d.margen_pct == null ? null : Number(d.margen_pct),
    insumos_por_vencer: d.por_vencer,
  }))

  return {
    instrucciones: [
      'Eres el asistente de cocina de un restaurante. Eliges qué platos conviene tener preparados (mise en place) para el servicio de hoy.',
      `Elige como máximo ${MAX_PLATOS} platos de la lista, de más a menos importante.`,
      'Criterios, en este orden: 1) que se vendan este día de la semana; 2) aprovechar insumos por vencer (pocos días); 3) mejor margen por plato.',
      'Porciones: un entero entre 1 y el tope_porciones del plato, cerca de lo que se vende este día. Nunca más de las porciones que alcanzan.',
      'Usa solo las ref de la lista. El motivo es una frase corta en español basada en los números (no inventes datos).',
    ].join('\n'),
    mensaje: `Platos que se pueden preparar hoy (JSON):\n${JSON.stringify(datos)}`,
    esquema: ESQUEMA,
    temperatura: 0.3,
  }
}

export function armarSugerenciaPlatos(datos: DatoPlato[], candidatos: DatoPlato[], respuesta: unknown): SugerenciaPlatos {
  const r = (respuesta ?? {}) as RespuestaIAPlatos
  const porRef = new Map(candidatos.map((d, i) => [`p${i + 1}`, d]))
  const vistos = new Set<string>()
  const items: PlatoSugerido[] = []

  for (const item of Array.isArray(r.items) ? r.items : []) {
    if (items.length >= MAX_PLATOS) break
    const ref = String(item.ref ?? '')
    const d = porRef.get(ref)
    if (!d || vistos.has(ref)) continue
    vistos.add(ref)

    const propuesta = Math.round(Number(item.porciones))
    if (!Number.isFinite(propuesta) || propuesta < 1) continue
    const porciones = Math.min(propuesta, topePorciones(d))
    if (porciones < 1) continue

    items.push({
      menu_item_id: d.menu_item_id,
      plato: d.plato,
      porciones,
      motivo: typeof item.motivo === 'string' ? item.motivo.trim().slice(0, 240) : '',
      porciones_posibles: d.porciones_posibles,
      ventas_esperadas: Number(d.ventas_esperadas),
      margen: d.margen,
      margen_pct: d.margen_pct,
      por_vencer: d.por_vencer,
    })
  }

  return {
    resumen: typeof r.resumen === 'string' ? r.resumen.trim().slice(0, 400) : '',
    items,
    sin_stock: platosSinStock(datos),
  }
}
