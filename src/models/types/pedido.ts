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

export interface PlatoConExtras {
  id: string
  tenant_id: string
  categoria_id: string
  nombre: string
  descripcion: string | null
  precio_base: number
  imagen_url: string | null
  receta?: import('./inventario').Receta[]
  extras: { nombre: string; precio: number }[]
  proteina?: { opciones: string[] }
  quitar?: string[]
}

export interface ItemCarrito {
  id: string
  menuItemId: string
  nombre: string
  cantidad: number
  precioBase: number
  extras: { nombre: string; precio: number }[]
  proteinaSeleccionada?: string
  ingredientesQuitados: string[]
  nota: string
  precioTotal: number
  agregadoPor: string
}
