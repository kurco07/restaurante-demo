export interface PedidoItem {
  id: string
  tenant_id: string
  sede_id: string
  sesion_id: string
  menu_item_id: string
  cantidad: number
  precio_unitario: number
  notas: string | null
  agregado_por: string | null
  estado: 'pendiente' | 'en_preparacion' | 'listo' | 'entregado'
  client_local_id: string
  sincronizado_en: string | null
  creado_en: string
}
