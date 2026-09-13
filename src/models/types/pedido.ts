export interface PedidoItem {
  id: string
  sesion_mesa_id: string
  menu_item_id: string
  cantidad: number
  precio_unitario: number
  notas: string | null
  estado: 'pendiente' | 'en_preparacion' | 'listo' | 'entregado'
  creado_en: string
}
