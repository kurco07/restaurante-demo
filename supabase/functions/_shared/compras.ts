import type { EsquemaJSON, PeticionIA } from './ia/proveedor.ts'

// ============================================================
// Fase 6, Módulo 2 — Sugerencias de compra: qué se le pide a la IA y
// cómo se valida lo que contesta
// ============================================================
// Cálculo mixto (decisión de Pedro, 2026-10-26): los números los calcula
// la base (datos_sugerencia_compra, migración 0021) y la IA solo puede
// ajustar cada cantidad entre 0 y MARGEN × la base, y explicar por qué.
// Nada de lo que conteste la IA se usa sin pasar por armarSugerencia:
// insumos que no estaban en la lista se descartan, las cantidades se
// recortan al margen, y si se saltea un insumo, queda con su cantidad
// base. Sin dependencias de Deno, para probarlo con Node.

export const MARGEN_IA = 1.5

// Una fila de datos_sugerencia_compra
export interface CandidatoCompra {
  insumo_id: string
  insumo: string
  unidad: string
  stock: number
  minimo: number
  consumo_diario: number
  dias_alcanza: number | null
  pedido_pendiente: number
  cantidad_base: number
  proveedor_id: string | null
  proveedor: string | null
  costo_estimado: number | null
}

export type Prioridad = 'alta' | 'media' | 'baja'

export interface ItemSugerido extends CandidatoCompra {
  cantidad: number
  prioridad: Prioridad
  motivo: string
  // false = la IA no lo revisó y quedó la cantidad base
  revisado_por_ia: boolean
}

export interface SugerenciaCompra {
  dias: number
  resumen: string
  items: ItemSugerido[]
}

interface RespuestaIACompra {
  resumen?: unknown
  items?: { ref?: unknown; cantidad?: unknown; prioridad?: unknown; motivo?: unknown }[]
}

const ESQUEMA: EsquemaJSON = {
  type: 'object',
  properties: {
    resumen: { type: 'string', description: 'Una o dos frases para quien compra' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'La ref del insumo, tal cual' },
          cantidad: { type: 'number' },
          prioridad: { type: 'string', enum: ['alta', 'media', 'baja'] },
          motivo: { type: 'string', description: 'Una frase corta' },
        },
        required: ['ref', 'cantidad', 'prioridad', 'motivo'],
      },
    },
  },
  required: ['resumen', 'items'],
}

// Mismo redondeo que la base: entero para 'unidad', un decimal si no
export function redondear(cantidad: number, unidad: string) {
  return unidad === 'unidad' ? Math.ceil(cantidad) : Math.ceil(cantidad * 10) / 10
}

function prioridadPorDias(c: CandidatoCompra, dias: number): Prioridad {
  if (c.stock < c.minimo || (c.dias_alcanza != null && c.dias_alcanza < 2)) return 'alta'
  if (c.dias_alcanza != null && c.dias_alcanza < dias) return 'media'
  return 'baja'
}

// Solo se sugieren los que hace falta comprar. Cada uno lleva una ref
// corta (i1, i2…) en vez del id, para que la IA no tenga que copiar uuids.
export function candidatosAComprar(candidatos: CandidatoCompra[]) {
  return candidatos.filter((c) => Number(c.cantidad_base) > 0)
}

export function peticionCompra(candidatos: CandidatoCompra[], dias: number): PeticionIA {
  // Solo cifras y nombres de insumos: nunca nombres de personas ni datos
  // de clientes (arquitectura.md §4.5)
  const datos = candidatos.map((c, i) => ({
    ref: `i${i + 1}`,
    insumo: c.insumo,
    unidad: c.unidad,
    stock: Number(c.stock),
    minimo: Number(c.minimo),
    consumo_diario: Number(c.consumo_diario),
    dias_que_alcanza: c.dias_alcanza,
    ya_pedido_sin_llegar: Number(c.pedido_pendiente),
    cantidad_base: Number(c.cantidad_base),
  }))

  return {
    instrucciones: [
      'Eres el asistente de compras de un restaurante. Revisas una lista de insumos que hay que reponer y propones cuánto comprar.',
      `La cantidad_base ya está calculada para cubrir ${dias} días de consumo más el stock mínimo, descontando el stock y lo ya pedido.`,
      `Reglas: usa solo las ref de la lista; para cada una propone una cantidad entre 0 y ${MARGEN_IA} veces su cantidad_base, en su unidad.`,
      'Mantén la cantidad_base salvo que haya una razón clara en los números (por ejemplo, un consumo muy irregular o un stock muy por debajo del mínimo).',
      'Prioridad: alta si se acaba en menos de 2 días o está bajo el mínimo; media si no alcanza para el período; baja en otro caso.',
      'El motivo es una frase corta en español, basada en los números. No inventes precios ni proveedores.',
    ].join('\n'),
    mensaje: `Insumos a reponer (JSON):\n${JSON.stringify(datos)}`,
    esquema: ESQUEMA,
    temperatura: 0.2,
  }
}

export function armarSugerencia(candidatos: CandidatoCompra[], respuesta: unknown, dias: number): SugerenciaCompra {
  const r = (respuesta ?? {}) as RespuestaIACompra
  const porRef = new Map(candidatos.map((c, i) => [`i${i + 1}`, c]))
  const revisados = new Map<string, { cantidad: number; prioridad: Prioridad; motivo: string }>()

  for (const item of Array.isArray(r.items) ? r.items : []) {
    const ref = String(item.ref ?? '')
    const c = porRef.get(ref)
    if (!c || revisados.has(ref)) continue // inventado o repetido: se ignora

    const base = Number(c.cantidad_base)
    const propuesta = Number(item.cantidad)
    const cantidad = Number.isFinite(propuesta)
      ? redondear(Math.min(Math.max(propuesta, 0), base * MARGEN_IA), c.unidad)
      : base
    const prioridad = ['alta', 'media', 'baja'].includes(String(item.prioridad))
      ? (item.prioridad as Prioridad)
      : prioridadPorDias(c, dias)
    const motivo = typeof item.motivo === 'string' && item.motivo.trim() ? item.motivo.trim().slice(0, 240) : ''

    revisados.set(ref, { cantidad, prioridad, motivo })
  }

  const items: ItemSugerido[] = candidatos.map((c, i) => {
    const rev = revisados.get(`i${i + 1}`)
    return {
      ...c,
      cantidad: rev ? rev.cantidad : Number(c.cantidad_base),
      prioridad: rev ? rev.prioridad : prioridadPorDias(c, dias),
      motivo: rev?.motivo || (rev ? '' : 'La IA no lo revisó: queda la cantidad calculada.'),
      revisado_por_ia: Boolean(rev),
    }
  })

  const orden: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 }
  items.sort((a, b) => orden[a.prioridad] - orden[b.prioridad] || a.insumo.localeCompare(b.insumo, 'es'))

  return {
    dias,
    resumen: typeof r.resumen === 'string' ? r.resumen.trim().slice(0, 400) : '',
    items,
  }
}
