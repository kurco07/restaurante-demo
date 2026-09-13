export interface CategoriaMenu {
  id: string
  tenant_id: string
  nombre: string
  orden: number
}

export interface MenuItem {
  id: string
  tenant_id: string
  categoria_id: string
  nombre: string
  descripcion: string | null
  precio_base: number
  imagen_url: string | null
}

export interface MenuItemSede {
  id: string
  tenant_id: string
  menu_item_id: string
  sede_id: string
  disponible: boolean
  precio_override: number | null
}
