// lotes_insumo es físico y local a la sede (una salsa preparada existe en
// una sede concreta, no en el catálogo abstracto del tenant). Solo tiene
// sentido para insumos.tipo = 'por_lote'. No hay columna `estado` — se
// deriva en el cliente (ver useLotesInsumo.ts).
export interface LoteInsumo {
  id: string
  tenant_id: string
  sede_id: string
  insumo_id: string
  cantidad_inicial: number
  cantidad_restante: number
  abierto_en: string
  cerrado_en: string | null
  fecha_vencimiento: string | null
}

export type EstadoLote = 'activo' | 'por_vencer' | 'agotado'
