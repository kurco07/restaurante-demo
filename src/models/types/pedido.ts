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

export interface Plato {
  id: string
  tenant_id: string
  categoria_id: string
  nombre: string
  descripcion: string | null
  precio_base: number
  imagen_url: string | null
  modelo_ar_glb_url: string | null
  modelo_ar_usdz_url: string | null
}

// Carrito es un borrador local, en memoria — solo se vuelve real
// (pedidos_items) al tocar "Enviar a cocina" (ver pedidoService.ts). El
// sistema de extras/proteína/ingredientes a quitar quedó fuera: no existe
// ninguna tabla para eso todavía (anotado como pendiente en la migración
// 0002), así que de momento un ítem es solo cantidad + nota libre.
export interface ItemCarrito {
  id: string
  menuItemId: string
  nombre: string
  cantidad: number
  precioBase: number
  nota: string
  precioTotal: number
}
