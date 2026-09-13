export interface Mesa {
  id: string
  tenant_id: string
  sede_id: string
  nombre_numero: string
  posicion_x: number | null
  posicion_y: number | null
  estado: 'libre' | 'ocupada' | 'por_limpiar'
}

export interface SesionMesa {
  id: string
  tenant_id: string
  sede_id: string
  mesa_id: string
  mesonero_id: string | null
  estado: 'abierta' | 'cerrada'
  origen: 'mesonero' | 'autopedido' | 'hibrido'
  abierta_en: string
  cerrada_en: string | null
}
