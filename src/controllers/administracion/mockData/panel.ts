import type {
  AlertaInventario,
  IndicadoresPanel,
  MesaResumen,
  PedidoReciente,
  PeriodoPanel,
  ProductoMasVendido,
  VentaDia,
} from '../../../models/types'

// Datos de ejemplo del panel de administración (mockup-admin-home.html).
// Se reemplazan por consultas reales (ventas, pedidos, inventario, mesas)
// cuando se conecte el módulo — por ahora es solo el recorrido visual.

export const indicadoresPorPeriodo: Record<PeriodoPanel, IndicadoresPanel> = {
  hoy: { ventas: 1284.5, ventasDelta: 12, pedidos: 96, pedidosDelta: 8, ticketPromedio: 13.4, ticketPromedioDelta: -3 },
  semana: { ventas: 5360, ventasDelta: 6, pedidos: 402, pedidosDelta: 4, ticketPromedio: 13.33, ticketPromedioDelta: 2 },
  mes: { ventas: 21870, ventasDelta: -2, pedidos: 1655, pedidosDelta: 1, ticketPromedio: 13.21, ticketPromedioDelta: -3 },
}

export const ventasSemana: VentaDia[] = [
  { dia: 'Mar', total: 610, esHoy: false },
  { dia: 'Mié', total: 540, esHoy: false },
  { dia: 'Jue', total: 680, esHoy: false },
  { dia: 'Vie', total: 890, esHoy: false },
  { dia: 'Sáb', total: 1240, esHoy: false },
  { dia: 'Dom', total: 980, esHoy: false },
  { dia: 'Lun', total: 420, esHoy: true },
]

export const pedidosRecientes: PedidoReciente[] = [
  { id: 'p1', mesaNumero: 12, codigo: '12', items: 5, mesonero: 'Valentina', total: 40, minutosAtras: 2, estado: 'entregado' },
  { id: 'p2', mesaNumero: 7, codigo: '7', items: 3, mesonero: 'Carlos', total: 27.5, minutosAtras: 8, estado: 'cocina' },
  { id: 'p3', mesaNumero: null, codigo: '#204', items: 2, mesonero: 'Valentina', total: 14, minutosAtras: 15, estado: 'entregado' },
  { id: 'p4', mesaNumero: 3, codigo: '3', items: 1, mesonero: 'Carlos', total: 12, minutosAtras: 22, estado: 'cancelado' },
  { id: 'p5', mesaNumero: 9, codigo: '9', items: 4, mesonero: 'Valentina', total: 33.5, minutosAtras: 30, estado: 'entregado' },
]

export const masVendidos: ProductoMasVendido[] = [
  { id: 'burger', nombre: 'Hamburguesa doble clásica', unidades: 42, ingresos: 357 },
  { id: 'papas', nombre: 'Papas cheddar bacon', unidades: 38, ingresos: 228 },
  { id: 'pizza', nombre: 'Pizza pepperoni familiar', unidades: 21, ingresos: 252 },
  { id: 'pollo', nombre: 'Combo pollo frito x3', unidades: 18, ingresos: 180 },
]

export const alertasInventario: AlertaInventario[] = [
  { id: 'papas-congeladas', nombre: 'Papas congeladas', cantidad: 4, unidad: 'kg' },
  { id: 'queso-cheddar', nombre: 'Queso cheddar', cantidad: 2.5, unidad: 'kg' },
  { id: 'pan-hamburguesa', nombre: 'Pan para hamburguesa', cantidad: 15, unidad: 'uds' },
]

export const mesasSalon: MesaResumen[] = [
  { numero: 1, estado: 'libre' },
  { numero: 2, estado: 'ocupada' },
  { numero: 3, estado: 'ocupada' },
  { numero: 4, estado: 'ocupada' },
  { numero: 5, estado: 'libre' },
  { numero: 6, estado: 'por_limpiar' },
  { numero: 7, estado: 'ocupada' },
  { numero: 8, estado: 'libre' },
  { numero: 9, estado: 'ocupada' },
  { numero: 10, estado: 'ocupada' },
  { numero: 11, estado: 'ocupada' },
  { numero: 12, estado: 'ocupada' },
]
