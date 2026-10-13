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

// Físico y local a la sede, igual que lotes_insumo. 'salida' la crea sola
// el trigger de descuento automático al entregar un pedido (Fase 4,
// Módulo 2) — 'entrada'/'merma'/'ajuste' se registran a mano o al
// recibir una orden de compra (Módulo 5). creado_por nulo = automático.
export type TipoMovimiento = 'entrada' | 'salida' | 'merma' | 'ajuste'

export interface MovimientoInventario {
  id: string
  tenant_id: string
  sede_id: string
  insumo_id: string
  tipo: TipoMovimiento
  cantidad: number
  referencia: string | null
  fecha: string
  creado_por: string | null
}
