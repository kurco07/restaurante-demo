import type { Mesa } from './mesa'

export type PeriodoPanel = 'hoy' | 'semana' | 'mes'

export interface IndicadoresPanel {
  ventas: number
  ventasDelta: number
  pedidos: number
  pedidosDelta: number
  ticketPromedio: number
  ticketPromedioDelta: number
}

export interface VentaDia {
  dia: string
  total: number
  esHoy: boolean
}

export type EstadoPedidoReciente = 'entregado' | 'cocina' | 'cancelado'

export interface PedidoReciente {
  id: string
  // Número de mesa, o null si es para llevar
  mesaNumero: number | null
  codigo: string
  items: number
  mesonero: string
  total: number
  minutosAtras: number
  estado: EstadoPedidoReciente
}

export interface ProductoMasVendido {
  id: string
  nombre: string
  unidades: number
  ingresos: number
}

export interface AlertaInventario {
  id: string
  nombre: string
  cantidad: number
  unidad: string
}

export interface MesaResumen {
  numero: number
  estado: Mesa['estado']
}

// ---- Reportes ----

export interface IndicadoresReporte {
  ventasMes: number
  pedidosMes: number
  ticketPromedioMes: number
}

export interface VentaSemanalReporte {
  semana: string
  total: number
  actual: boolean
}

export interface HoraPico {
  rango: string
  intensidad: number
  etiqueta: string
}

export interface VentaCategoria {
  categoria: string
  porcentaje: number
  monto: number
}

// ---- Proveedores ----

export interface Proveedor {
  id: string
  nombre: string
  categoria: string
  telefono: string
  correo: string
  entregaEstimada: string
  formaPago: string
  nota: string
  insumos: string[]
  activo: boolean
}

// ---- Personal ----

export type PuestoEmpleado = 'mesonero' | 'cocinero' | 'administracion'

export interface Empleado {
  id: string
  nombre: string
  puesto: PuestoEmpleado
  puestoLabel: string
  turno: string
  telefono: string
  correo: string
  fechaIngreso: string
  activo: boolean
}

// ---- Pedidos (vista de administración) ----

export type EstadoPedidoAdmin = 'cocina' | 'listo' | 'cuenta' | 'entregado' | 'cancelado'

export interface ItemPedidoAdmin {
  nombre: string
  cantidad: number
  precioUnitario: number
}

export interface PedidoAdmin {
  id: string
  mesaNumero: number | null
  codigoParaLlevar: string | null
  mesonero: string
  items: ItemPedidoAdmin[]
  total: number
  estado: EstadoPedidoAdmin
  horaLabel: string
}


// ---- Configuración ----

export interface DatosRestaurante {
  nombre: string
  direccion: string
  telefono: string
  horario: string
}

export interface Facturacion {
  moneda: string
  impuesto: number
  propinaSugerida: number
}

export interface ColorMarca {
  nombre: string
  hex: string
}

export interface PreferenciaNotificacion {
  id: string
  label: string
}

// ---- Inventario: órdenes de compra ----

// Estados del mockup. Ojo: `ordenes_compra.estado` en 0002 solo admite
// borrador / aprobada / recibida — "pendiente" y "rechazada" aún no existen en la BD.
export type EstadoOrdenCompra = 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'recibida'

export interface ItemOrdenCompra {
  insumo: string
  cantidad: number
  unidad: string
  costoUnitario: number
}

export interface OrdenCompra {
  id: string
  codigo: string
  proveedor: string
  solicitadaPor: string
  estado: EstadoOrdenCompra
  fecha: string
  fechaSolicitud: string
  entregaEstimada: string
  items: ItemOrdenCompra[]
}

