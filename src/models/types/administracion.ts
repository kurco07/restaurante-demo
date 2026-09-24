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
