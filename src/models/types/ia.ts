// Respuesta de la Edge Function ia-probar (Fase 6, Módulo 1)
export type ResultadoPruebaIA =
  | { ok: true; proveedor: string; modelo: string; milisegundos: number; respuesta: string }
  | { ok: false; codigo?: string; mensaje: string; milisegundos?: number; modelosDisponibles?: string[] }

// Fase 6, Módulo 2 — una sugerencia de compra guardada en sugerencias_ia.
// contenido lo arma la Edge Function ia-sugerir-compras (armarSugerencia).
export type PrioridadCompra = 'alta' | 'media' | 'baja'

export interface ItemSugerenciaCompra {
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
  cantidad: number
  prioridad: PrioridadCompra
  motivo: string
  revisado_por_ia: boolean
}

export type EstadoSugerencia = 'pendiente' | 'aprobada' | 'rechazada'

export interface SugerenciaCompra {
  id: string
  estado: EstadoSugerencia
  generada_en: string
  revisada_en: string | null
  revisada_por: string | null // nombre
  dias: number
  resumen: string
  modelo: string
  items: ItemSugerenciaCompra[]
  ordenesCreadas: number
  motivoRechazo: string | null
}

// Lo que administración deja al revisar, para aprobar_sugerencia_compra
export interface ItemAprobadoCompra {
  insumo_id: string
  cantidad: number
  proveedor_id: string
  costo_estimado: number | null
}

export type ResultadoGenerarCompra =
  | { ok: true; sugerenciaId: string | null; mensaje?: string }
  | { ok: false; codigo?: string; mensaje: string }

// Fase 6, Módulo 3 — sugerencia de platos a preparar (contenido lo arma la
// Edge Function ia-sugerir-platos con armarSugerenciaPlatos)
export interface PlatoSugeridoIA {
  menu_item_id: string
  plato: string
  porciones: number
  motivo: string
  porciones_posibles: number | null
  ventas_esperadas: number
  margen: number | null
  margen_pct: number | null
  por_vencer: { insumo: string; dias: number }[]
}

export interface SugerenciaPlatos {
  id: string
  estado: EstadoSugerencia
  generada_en: string
  revisada_en: string | null
  revisada_por: string | null
  resumen: string
  modelo: string
  items: PlatoSugeridoIA[]
  sin_stock: { plato: string; insumo_limitante: string | null; ventas_esperadas: number }[]
  aprobados: { plato: string; porciones: number }[]
  motivoRechazo: string | null
}

export interface PlatoAprobado {
  menu_item_id: string
  porciones: number
}

// Lo que ve cocina (platos_sugeridos_hoy, migración 0022): sin precios
export interface PlatosSugeridosHoy {
  aprobada_en: string
  items: { plato: string; porciones: number; motivo: string }[]
}

// Fase 6, Módulo 4 — recomendados del día (contenido lo arma la Edge
// Function ia-sugerir-recomendados con armarRecomendados)
export interface RecomendadoIA {
  menu_item_id: string
  plato: string
  frase: string // la leen mesonero y cliente
  motivo: string // solo gerencia
  porciones_posibles: number | null
  margen: number | null
  margen_pct: number | null
  por_vencer: { insumo: string; dias: number }[]
}

export interface SugerenciaRecomendados {
  id: string
  estado: EstadoSugerencia
  generada_en: string
  revisada_en: string | null
  revisada_por: string | null
  resumen: string
  modelo: string
  items: RecomendadoIA[]
  aprobados: { plato: string; frase: string }[]
  motivoRechazo: string | null
}

export interface RecomendadoAprobado {
  menu_item_id: string
  frase: string
}

// Lo que ven mesonero y cliente (recomendados_hoy / recomendados_mesa,
// migración 0023): plato y frase, sin precios
export interface RecomendadosHoy {
  aprobada_en: string
  items: { menu_item_id: string; plato: string; frase: string }[]
}
