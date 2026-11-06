import { useEffect, useState } from 'react'
import type { ComparacionSede, SedeResumen } from '../../models/types'
import { fetchKpisRentabilidad, fetchKpisSedes } from '../../models/services/kpisService'
import { mensajeDeError } from '../../lib/errores'

export interface FilaComparacionSede extends ComparacionSede {
  // Margen bruto sobre los platos con costo completo en esa sede (mismo
  // criterio que Rentabilidad); null si ningún plato vendido tiene costo
  ganancia: number | null
  margenPct: number | null
}

// Comparación entre sedes del período (Fase 5, Módulo 3). Los números de
// cada sede salen de kpis_sedes; el margen, de kpis_rentabilidad por sede,
// para que se calcule igual que en la página de Rentabilidad.
export function useComparacionSedes(desde: Date, hasta: Date, sedes: SedeResumen[]) {
  const [filas, setFilas] = useState<FilaComparacionSede[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    Promise.all([fetchKpisSedes(desde, hasta), ...sedes.map((s) => fetchKpisRentabilidad(desde, hasta, s.id))])
      .then(([comparacion, ...rentabilidades]) => {
        if (cancelado) return
        const margenPorSede = new Map(
          sedes.map((s, i) => {
            const completos = rentabilidades[i].filter((f) => f.estado === 'ok')
            const ventas = completos.reduce((t, f) => t + Number(f.importe), 0)
            const ganancia = completos.reduce((t, f) => t + Number(f.ganancia ?? 0), 0)
            const margen = completos.length ? { ganancia, margenPct: ventas > 0 ? (ganancia / ventas) * 100 : null } : null
            return [s.id, margen] as const
          }),
        )
        setFilas(
          comparacion.map((c) => ({
            ...c,
            ganancia: margenPorSede.get(c.sede_id)?.ganancia ?? null,
            margenPct: margenPorSede.get(c.sede_id)?.margenPct ?? null,
          })),
        )
        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(mensajeDeError(e))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [desde, hasta, sedes])

  return { filas, cargando, error }
}
