// Catálogo por tenant: qué insumos existen, sin cantidad (eso vive en
// InventarioSede, cuánto hay en cada sede). Ver docs/modelo-de-datos.md.
export interface Insumo {
  id: string
  tenant_id: string
  nombre: string
  unidad_de_medida: string
  tipo: 'exacto' | 'por_lote' | 'estimado'
}

export interface InventarioSede {
  id: string
  tenant_id: string
  sede_id: string
  insumo_id: string
  cantidad_actual: number
  stock_minimo: number | null
}

export interface Receta {
  id: string
  tenant_id: string
  menu_item_id: string
  insumo_id: string
  cantidad_requerida: number
  unidad: string
}
