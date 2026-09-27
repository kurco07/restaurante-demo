export interface ExtraPlato {
  nombre: string
  precio: number
}

export interface PlatoAutopedido {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  gradiente: string
  proteinas?: string[]
  quitables?: string[]
  extras?: ExtraPlato[]
}

export interface ItemPedidoMesa {
  id: string
  nombre: string
  cantidad: number
  modificaciones: string[]
  agregadoPor: string
  precioTotal: number
}
