import { useState } from 'react'
import { horasPico, indicadoresReporte, ventasPorCategoria, ventasPorSemana } from './mockData/reportes'

export type PeriodoReporte = 'semana' | 'mes' | 'personalizado'

export function useReportes() {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('mes')

  return {
    periodo,
    setPeriodo,
    indicadores: indicadoresReporte,
    ventasPorSemana,
    ventaMaxima: Math.max(...ventasPorSemana.map((v) => v.total)),
    horasPico,
    ventasPorCategoria,
  }
}
