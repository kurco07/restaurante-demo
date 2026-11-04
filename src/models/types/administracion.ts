import type { Mesa } from './mesa'
import type { Rol } from './usuario'

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

// Mismos 4 estados reales que PedidoAdmin (definido más abajo) — un solo
// lugar donde se deriva el estado de un pedido, reutilizado por el
// widget resumido del panel y por la pantalla completa de Pedidos.
export type EstadoPedidoReciente = EstadoPedidoAdmin

export interface PedidoReciente {
  id: string
  mesaNumero: string
  items: number
  mesonero: string
  total: number
  horaLabel: string
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
  numero: string
  estado: Mesa['estado']
}

// ---- Personal ----
// No hay concepto de "turno" en esta app (Fase 5: reporte por día
// calendario, no por turno) — a propósito no se agrega acá tampoco.

export interface Empleado {
  id: string
  nombre: string
  rol: Rol
  telefono: string | null
  email: string | null
  fechaIngreso: string
  activo: boolean
}

// ---- Pedidos (vista de administración) ----
// No existe un estado real de "cuenta pedida" en el modelo de datos (no
// hay ninguna señal de que el cliente pidió la cuenta antes de que el
// mesonero la cierre de verdad) — se queda fuera hasta que exista esa
// señal. "Para llevar" tampoco existe todavía: todo pedido real pasa por
// una mesa física (ver CLAUDE.md / arquitectura.md).
export type EstadoPedidoAdmin = 'cocina' | 'listo' | 'entregado' | 'cancelado'

export interface ItemPedidoAdmin {
  nombre: string
  cantidad: number
  precioUnitario: number
}

export interface PedidoAdmin {
  id: string
  mesaNumero: string
  mesonero: string
  items: ItemPedidoAdmin[]
  total: number
  estado: EstadoPedidoAdmin
  horaLabel: string
}


// ---- Configuración ----
// Lo que trae/recibe sedeService.ts, tal como vive en la tabla sedes
// (migración 0034). Por sede, no por tenant completo — decisión del
// dueño, consistente con que direccion ya vivía a ese nivel. La moneda
// queda fuera a propósito (ver nota en 0002: "merece una decisión
// propia, no una columna improvisada").
export interface SedeConfig {
  nombre: string
  direccion: string | null
  telefono: string | null
  horario: string | null
  impuesto_porcentaje: number
  propina_sugerida_pct: number
  notif_stock_bajo: boolean
  notif_pedidos_demorados: boolean
  notif_resumen_diario: boolean
}


