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


