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
