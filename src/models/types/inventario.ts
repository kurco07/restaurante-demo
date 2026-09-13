export interface Insumo {
  id: string
  tenant_id: string
  sede_id: string
  nombre: string
  unidad: string
  stock_actual: number
  stock_minimo: number
  costo_unitario: number
  creado_en: string
}

export interface Receta {
  id: string
  menu_item_id: string
  insumo_id: string
  cantidad_necesaria: number
}
