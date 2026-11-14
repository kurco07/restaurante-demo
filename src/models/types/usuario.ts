export type Rol =
  | 'mesonero'
  | 'cocina'
  | 'supervisor'
  | 'administracion'
  | 'gerencia'
  | 'super_admin'

export interface Usuario {
  id: string
  tenant_id: string
  sede_id: string | null
  nombre: string
  contacto: string | null
  rol: Rol
  creado_en: string
  sesion_token: string | null
}
