import type { HoraPico, IndicadoresReporte, VentaCategoria, VentaSemanalReporte } from '../../../models/types'

export const indicadoresReporte: IndicadoresReporte = {
  ventasMes: 28450,
  pedidosMes: 2140,
  ticketPromedioMes: 13.29,
}

export const ventasPorSemana: VentaSemanalReporte[] = [
  { semana: 'Sem 1', total: 6200, actual: false },
  { semana: 'Sem 2', total: 7100, actual: false },
  { semana: 'Sem 3', total: 6850, actual: false },
  { semana: 'Sem 4', total: 8300, actual: true },
]

export const horasPico: HoraPico[] = [
  { rango: '19:00 – 21:00', intensidad: 100, etiqueta: 'Muy alto' },
  { rango: '12:00 – 14:00', intensidad: 90, etiqueta: 'Alto' },
  { rango: '21:00 – 22:00', intensidad: 55, etiqueta: 'Medio' },
  { rango: '08:00 – 10:00', intensidad: 20, etiqueta: 'Bajo' },
]

export const ventasPorCategoria: VentaCategoria[] = [
  { categoria: 'Hamburguesas', porcentaje: 34, monto: 9673 },
  { categoria: 'Pizzas', porcentaje: 22, monto: 6259 },
  { categoria: 'Pollo frito', porcentaje: 19, monto: 5406 },
  { categoria: 'Papas fritas', porcentaje: 12, monto: 3414 },
  { categoria: 'Bebidas', porcentaje: 8, monto: 2276 },
  { categoria: 'Wraps', porcentaje: 5, monto: 1423 },
]
