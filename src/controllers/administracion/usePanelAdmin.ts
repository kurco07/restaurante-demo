import { useEffect, useMemo, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import type { AlertaInventario, IndicadoresPanel, MesaResumen, PedidoReciente, PeriodoPanel, ProductoMasVendido, VentaDia } from '../../models/types'
import { fetchKpisVentas } from '../../models/services/kpisService'
import { fetchMesas } from '../../models/services/mesaService'
import { fetchPedidosAdminDia } from '../../models/services/pedidosAdminService'
import { fetchInsumos, fetchInventarioSede } from '../../models/services/inventarioService'

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

function sumarDias(fecha: Date, dias: number) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias)
}

// Rango [desde, hasta) para cada período, más el rango inmediatamente
// anterior de igual duración — para el delta que muestran las tarjetas.
function rangoDe(periodo: PeriodoPanel) {
  const hoy = inicioDelDia(new Date())
  const hasta = sumarDias(hoy, 1)
  if (periodo === 'hoy') return { desde: hoy, hasta, desdeAnterior: sumarDias(hoy, -1), hastaAnterior: hoy }
  if (periodo === 'semana') {
    const desde = sumarDias(hoy, -6)
    return { desde, hasta, desdeAnterior: sumarDias(desde, -7), hastaAnterior: desde }
  }
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const desdeAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  return { desde, hasta, desdeAnterior, hastaAnterior: desde }
}

function delta(actual: number, anterior: number) {
  if (anterior === 0) return actual === 0 ? 0 : 100
  return Math.round(((actual - anterior) / anterior) * 100)
}

interface ConteoMesas {
  ocupadas: number
  libres: number
  porLimpiar: number
}

export function usePanelAdmin() {
  const { usuario } = useUsuario()
  const [periodo, setPeriodo] = useState<PeriodoPanel>('hoy')
  const [indicadores, setIndicadores] = useState<IndicadoresPanel>({
    ventas: 0, ventasDelta: 0, pedidos: 0, pedidosDelta: 0, ticketPromedio: 0, ticketPromedioDelta: 0,
  })
  const [ventasSemana, setVentasSemana] = useState<VentaDia[]>([])
  const [pedidosRecientes, setPedidosRecientes] = useState<PedidoReciente[]>([])
  const [masVendidos, setMasVendidos] = useState<ProductoMasVendido[]>([])
  const [alertasInventario, setAlertasInventario] = useState<AlertaInventario[]>([])
  const [mesas, setMesas] = useState<MesaResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const rango = useMemo(() => rangoDe(periodo), [periodo])

  useEffect(() => {
    if (!usuario?.sede_id) return
    let cancelado = false
    setCargando(true)

    const hoy = inicioDelDia(new Date())
    const hace7Dias = sumarDias(hoy, -6)

    Promise.all([
      fetchKpisVentas(rango.desde, rango.hasta, usuario.sede_id),
      fetchKpisVentas(rango.desdeAnterior, rango.hastaAnterior, usuario.sede_id),
      fetchKpisVentas(hace7Dias, sumarDias(hoy, 1), usuario.sede_id),
      fetchKpisVentas(hoy, sumarDias(hoy, 1), usuario.sede_id), // top_platos: siempre "hoy"
      fetchMesas(usuario.tenant_id, usuario.sede_id),
      fetchPedidosAdminDia(usuario.sede_id, hoy),
      fetchInsumos(usuario.tenant_id),
      fetchInventarioSede(usuario.tenant_id, usuario.sede_id),
    ])
      .then(([actual, anterior, ultimos7, deHoy, mesasData, pedidosData, insumos, inventario]) => {
        if (cancelado) return

        setIndicadores({
          ventas: actual.resumen.ventas,
          ventasDelta: delta(actual.resumen.ventas, anterior.resumen.ventas),
          pedidos: actual.resumen.cuentas,
          pedidosDelta: delta(actual.resumen.cuentas, anterior.resumen.cuentas),
          ticketPromedio: actual.resumen.ticket_promedio,
          ticketPromedioDelta: delta(actual.resumen.ticket_promedio, anterior.resumen.ticket_promedio),
        })

        const porDia = new Map(ultimos7.por_dia.map((d) => [d.dia, d.ventas]))
        const hoyIso = hoy.toISOString().slice(0, 10)
        const dias: VentaDia[] = []
        for (let f = hace7Dias; f <= hoy; f = sumarDias(f, 1)) {
          const iso = f.toISOString().slice(0, 10)
          dias.push({ dia: DIAS_CORTOS[f.getDay()], total: porDia.get(iso) ?? 0, esHoy: iso === hoyIso })
        }
        setVentasSemana(dias)

        setMasVendidos(
          deHoy.top_platos.slice(0, 4).map((p) => ({ id: p.plato, nombre: p.plato, unidades: p.cantidad, ingresos: p.importe })),
        )

        setMesas(mesasData.map((m) => ({ numero: m.nombre_numero, estado: m.estado })))

        setPedidosRecientes(
          pedidosData.slice(0, 5).map((p) => ({
            id: p.id,
            mesaNumero: p.mesaNumero,
            items: p.items.reduce((acc, i) => acc + i.cantidad, 0),
            mesonero: p.mesonero,
            total: p.total,
            horaLabel: p.horaLabel,
            estado: p.estado,
          })),
        )

        const unidadPorInsumo = new Map(insumos.map((i) => [i.id, { nombre: i.nombre, unidad: i.unidad_de_medida }]))
        setAlertasInventario(
          inventario
            .filter((inv) => inv.stock_minimo !== null && inv.cantidad_actual < inv.stock_minimo)
            .map((inv) => ({
              id: inv.id,
              nombre: unidadPorInsumo.get(inv.insumo_id)?.nombre ?? 'Insumo',
              cantidad: inv.cantidad_actual,
              unidad: unidadPorInsumo.get(inv.insumo_id)?.unidad ?? '',
            })),
        )

        setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudo cargar el panel')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [rango, usuario?.sede_id, usuario?.tenant_id])

  const conteoMesas: ConteoMesas = {
    ocupadas: mesas.filter((m) => m.estado === 'ocupada').length,
    libres: mesas.filter((m) => m.estado === 'libre').length,
    porLimpiar: mesas.filter((m) => m.estado === 'por_limpiar').length,
  }

  const fechaHoy = new Date()
    .toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/[.,]/g, '')

  return {
    cargando,
    error,
    periodo,
    setPeriodo,
    indicadores,
    ventasSemana,
    ventaMaximaSemana: Math.max(1, ...ventasSemana.map((v) => v.total)),
    pedidosRecientes,
    masVendidos,
    alertasInventario,
    mesas,
    conteoMesas,
    fechaHoy,
  }
}
