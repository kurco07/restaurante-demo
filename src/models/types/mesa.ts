export interface Mesa {
  id: string
  tenant_id: string
  sede_id: string
  numero: number
  capacidad: number
  estado: 'libre' | 'ocupada' | 'reservada'
  qr_token: string
  creado_en: string
}

export interface SesionMesa {
  id: string
  mesa_id: string
  mesonero_id: string | null
  estado: 'abierta' | 'cerrada'
  total: number
  creado_en: string
  cerrado_en: string | null
}
