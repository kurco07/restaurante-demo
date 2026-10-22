import { useEffect, useMemo, useState } from 'react'
import type { AlertaGerencia, KpisVentas, RentabilidadPlato, RotacionInsumo, SedeResumen, VentaPorDia } from '../../models/types'
import {
  fetchAlertas,
  fetchInsumosSinCompra,
  fetchKpisInventario,
  fetchKpisRentabilidad,
  fetchKpisVentas,
  fetchSedes,
} from '../../models/services/kpisService'

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

// Dashboard de KPIs de gerencia (Fase 5, Módulo 1): ventas, rotación de
// inventario y rentabilidad por plato del mismo período. sedeId elige una
// sede o, sin valor, todas las del restaurante juntas (Fase 5, Módulo 3).
export function useKpisVentas() {
  const [periodo, setPeriodo] = useState<PeriodoKpi>('7d')
  const [sedes, setSedes] = useState<SedeResumen[]>([])
  const [sedeId, setSedeId] = useState<string | undefined>(undefined)
  const [datos, setDatos] = useState<KpisVentas | null>(null)
  const [inventario, setInventario] = useState<RotacionInsumo[]>([])
  const [rentabilidad, setRentabilidad] = useState<RentabilidadPlato[]>([])
  // menu_item_id → insumos de su receta que nunca se compraron
  const [insumosSinCompra, setInsumosSinCompra] = useState<Record<string, string[]>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Alertas (Fase 5, Módulo 4): viven aquí para que la barra lateral
  // muestre cuántas hay en cualquier sección. Dependen de la sede, no del
  // período: cada alerta tiene su propia ventana fija (ver migración 0020).
  const [alertas, setAlertas] = useState<AlertaGerencia[]>([])
  const [cargandoAlertas, setCargandoAlertas] = useState(true)
  const [errorAlertas, setErrorAlertas] = useState<string | null>(null)

  const rango = useMemo(() => rangoDe(periodo), [periodo])

  useEffect(() => {
    let cancelado = false
    fetchSedes()
      .then((filas) => {
        if (!cancelado) setSedes(filas)
      })
      .catch(() => {
        // Sin la lista no hay selector; los KPIs igual suman todas las sedes
      })
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    let cancelado = false
    setCargandoAlertas(true)
    fetchAlertas(sedeId)
      .then((filas) => {
        if (cancelado) return
        setAlertas(filas)
        setErrorAlertas(null)
      })
      .catch((e: unknown) => {
        if (!cancelado) setErrorAlertas(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelado) setCargandoAlertas(false)
      })
    return () => {
      cancelado = true
    }
  }, [sedeId])

  useEffect(() => {
    let cancelado = false
    Promise.all([
      fetchKpisVentas(rango.desde, rango.hasta, sedeId),
      fetchKpisInventario(rango.desde, rango.hasta, sedeId),
      fetchKpisRentabilidad(rango.desde, rango.hasta, sedeId),
    ])
      .then(async ([kpis, rotacion, platos]) => {
        const incompletos = platos.filter((p) => p.estado === 'incompleto').map((p) => p.menu_item_id)
        const faltantes = await fetchInsumosSinCompra(incompletos, sedeId)
        if (cancelado) return
        setDatos(kpis)
        setInventario(rotacion)
        setRentabilidad(platos)
        setInsumosSinCompra(faltantes)
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
  }, [rango, sedeId])

  const porDia = useMemo(
    () => (datos ? completarDias(datos.por_dia, rango.desde, rango.hasta) : []),
    [datos, rango],
  )

  // Margen bruto del período, solo sobre platos con costo completo: un
  // plato sin receta o con un insumo nunca comprado no entra, porque
  // asumirle costo cero inflaría el margen.
  const resumenRentabilidad = useMemo(() => {
    const completos = rentabilidad.filter((f) => f.estado === 'ok')
    const ventas = completos.reduce((s, f) => s + Number(f.importe), 0)
    const ganancia = completos.reduce((s, f) => s + Number(f.ganancia ?? 0), 0)
    return {
      ganancia,
      margenPct: ventas > 0 ? (ganancia / ventas) * 100 : null,
      platosConCosto: completos.length,
      platosSinCosto: rentabilidad.length - completos.length,
    }
  }, [rentabilidad])

  function cambiarPeriodo(nuevo: PeriodoKpi) {
    if (nuevo === periodo) return
    setCargando(true)
    setPeriodo(nuevo)
  }

  function cambiarSede(nueva: string | undefined) {
    if (nueva === sedeId) return
    setCargando(true)
    setSedeId(nueva)
  }

  return { periodo, setPeriodo: cambiarPeriodo, rango, sedes, sedeId, setSedeId: cambiarSede, cargando, error, datos, porDia, inventario, rentabilidad, resumenRentabilidad, insumosSinCompra, alertas, cargandoAlertas, errorAlertas }
}
