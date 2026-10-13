// Proveedores y órdenes de compra. Catálogo por tenant (igual que
// Insumo) — sede_id nulo si la compra se centraliza a nivel de cadena.
export interface Proveedor {
  id: string
  tenant_id: string
  sede_id: string | null
  nombre: string
  contacto: string | null
}

// Solo estos 3 valores existen en la base (ver 0002_esquema_inicial.sql)
// — no hay "pendiente" ni "rechazada": una orden en borrador es la que
// está pendiente de aprobación, y descartar un borrador es eliminarlo.
export type EstadoOrdenCompra = 'borrador' | 'aprobada' | 'recibida'
