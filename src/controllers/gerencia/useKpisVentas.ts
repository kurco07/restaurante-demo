import { useEffect, useMemo, useState } from 'react'
import type { KpisVentas, RotacionInsumo, VentaPorDia } from '../../models/types'
import { fetchKpisInventario, fetchKpisVentas } from '../../models/services/kpisService'

export type PeriodoKpi = 'hoy' | '7d' | '30d' | 'mes'

export const PERIODOS_KPI: { key: PeriodoKpi; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d', label: 'Últimos 7 días' },
  { key: '30d', label: 'Últimos 30 días' },
  { key: 'mes', label: 'Este mes' },
]

function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

function sumarDias(fecha: Date, dias: number) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias)
}

// Los límites se calculan en la hora local del navegador de gerencia; los
// días y horas de las ventas los calcula el servidor en la zona horaria de
// cada sede. Con una sola zona horaria (el caso de hoy) coinciden.
function rangoDe(periodo: PeriodoKpi) {
  const hoy = inicioDelDia(new Date())
  const hasta = sumarDias(hoy, 1)
  if (periodo === 'hoy') return { desde: hoy, hasta }
  if (periodo === '7d') return { desde: sumarDias(hoy, -6), hasta }
  if (periodo === '30d') return { desde: sumarDias(hoy, -29), hasta }
  return { desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1), hasta }
}

function claveDia(fecha: Date) {
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${m}-${d}`
}

// Completa con cero los días sin ventas, para que el gráfico muestre el
// período entero y un día flojo se vea como tal (no desaparezca).
function completarDias(porDia: VentaPorDia[], desde: Date, hasta: Date): VentaPorDia[] {
  const porClave = new Map(porDia.map((d) => [d.dia, d]))
  const dias: VentaPorDia[] = []
  for (let f = desde; f < hasta; f = sumarDias(f, 1)) {
    const clave = claveDia(f)
    dias.push(porClave.get(clave) ?? { dia: clave, ventas: 0, cuentas: 0 })
  }
  return dias
}

// Dashboard de KPIs de gerencia (Fase 5, Módulo 1): ventas y rotación de
// inventario del mismo período. Rentabilidad por plato queda pendiente
// de decidir cómo se deriva el costo de un insumo.
export function useKpisVentas() {
  const [periodo, setPeriodo] = useState<PeriodoKpi>('7d')
  const [datos, setDatos] = useState<KpisVentas | null>(null)
  const [inventario, setInventario] = useState<RotacionInsumo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const rango = useMemo(() => rangoDe(periodo), [periodo])

  useEffect(() => {
    let cancelado = false
    Promise.all([fetchKpisVentas(rango.desde, rango.hasta), fetchKpisInventario(rango.desde, rango.hasta)])
      .then(([kpis, rotacion]) => {
        if (cancelado) return
        setDatos(kpis)
        setInventario(rotacion)
        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [rango])

  const porDia = useMemo(
    () => (datos ? completarDias(datos.por_dia, rango.desde, rango.hasta) : []),
    [datos, rango],
  )

  function cambiarPeriodo(nuevo: PeriodoKpi) {
    if (nuevo === periodo) return
    setCargando(true)
    setPeriodo(nuevo)
  }

  return { periodo, setPeriodo: cambiarPeriodo, cargando, error, datos, porDia, inventario }
}
