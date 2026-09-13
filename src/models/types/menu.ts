export interface CategoriaMenu {
  id: string
  tenant_id: string
  nombre: string
  orden: number
  creado_en: string
}

export interface MenuItem {
  id: string
  tenant_id: string
  categoria_id: string
  nombre: string
  descripcion: string | null
  precio: number
  disponible: boolean
  imagen_url: string | null
  creado_en: string
}

export interface MenuItemSede {
  id: string
  menu_item_id: string
  sede_id: string
  disponible: boolean
  precio_override: number | null
}
