import { useState } from 'react'
import type {
  AlertaInventario,
  IndicadoresPanel,
  MesaResumen,
  PedidoReciente,
  PeriodoPanel,
  ProductoMasVendido,
  VentaDia,
} from '../../models/types'
import {
  alertasInventario,
  indicadoresPorPeriodo,
  masVendidos,
  mesasSalon,
  pedidosRecientes,
  ventasSemana,
} from './mockData/panel'

interface ConteoMesas {
  ocupadas: number
  libres: number
  porLimpiar: number
}

interface UsePanelAdminReturn {
  periodo: PeriodoPanel
  setPeriodo: (periodo: PeriodoPanel) => void
  indicadores: IndicadoresPanel
  ventasSemana: VentaDia[]
  ventaMaximaSemana: number
  pedidosRecientes: PedidoReciente[]
  masVendidos: ProductoMasVendido[]
  alertasInventario: AlertaInventario[]
  mesas: MesaResumen[]
  conteoMesas: ConteoMesas
  fechaHoy: string
}

export function usePanelAdmin(): UsePanelAdminReturn {
  const [periodo, setPeriodo] = useState<PeriodoPanel>('hoy')

  const conteoMesas: ConteoMesas = {
    ocupadas: mesasSalon.filter((m) => m.estado === 'ocupada').length,
    libres: mesasSalon.filter((m) => m.estado === 'libre').length,
    porLimpiar: mesasSalon.filter((m) => m.estado === 'por_limpiar').length,
  }

  // Ej. "jue 24 sep"
  const fechaHoy = new Date()
    .toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/[.,]/g, '')

  return {
    periodo,
    setPeriodo,
    indicadores: indicadoresPorPeriodo[periodo],
    ventasSemana,
    ventaMaximaSemana: Math.max(...ventasSemana.map((v) => v.total)),
    pedidosRecientes,
    masVendidos,
    alertasInventario,
    mesas: mesasSalon,
    conteoMesas,
    fechaHoy,
  }
}
