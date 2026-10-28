// Forma de lo que devuelve la función pública menu_publico_mesa
// (migración 0003). Solo lo necesario para mostrar el menú al cliente.

export interface CategoriaAutopedido {
  id: string
  nombre: string
}

export interface PlatoAutopedido {
  id: string
  categoria_id: string
  nombre: string
  descripcion: string | null
  precio: number
  imagen_url: string | null
  modelo_ar_glb_url: string | null
  modelo_ar_usdz_url: string | null
}

export interface MenuPublicoMesa {
  restaurante: string
  marca: { logo_url: string | null; color_primario: string | null; color_secundario: string | null }
  modulos: { realidad_aumentada: boolean; ia_recomendados: boolean }
  mesa: { id: string; nombre_numero: string }
  categorias: CategoriaAutopedido[]
  platos: PlatoAutopedido[]
}

// Ítem del carrito del cliente. Vive en memoria del celular hasta que se
// envía con enviar_pedido_autopedido (migración 0004).
export interface ItemCarritoAutopedido {
  id: string
  plato: PlatoAutopedido
  cantidad: number
  nota: string
}

// Pedido compartido de la mesa, tal como lo devuelve la función pública
// pedido_publico_mesa (migración 0006): lo que cargó el mesonero y lo
// que pidió el cliente por QR, con su estado de cocina.
export type EstadoItemPedido = 'por_aprobar' | 'pendiente' | 'en_preparacion' | 'listo' | 'entregado'

export interface ItemPedidoCompartido {
  id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  notas: string | null
  estado: EstadoItemPedido
  por_qr: boolean
}

export interface PedidoCompartidoMesa {
  sesion_abierta: boolean
  items: ItemPedidoCompartido[]
}
