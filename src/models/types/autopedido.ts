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
}

export interface MenuPublicoMesa {
  restaurante: string
  mesa: { id: string; nombre_numero: string }
  categorias: CategoriaAutopedido[]
  platos: PlatoAutopedido[]
}

// Ítem del carrito del cliente. Por ahora vive solo en memoria del
// celular — el envío a cocina es Fase 3, Módulo 2.
export interface ItemCarritoAutopedido {
  id: string
  plato: PlatoAutopedido
  cantidad: number
  nota: string
}
