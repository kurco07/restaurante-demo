import { useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import {
  fetchInsumos,
  fetchInventarioSede,
  fetchMovimientos,
  registrarAjusteManual,
  type MovimientoConDetalle,
} from '../../models/services/inventarioService'
import type { Insumo, InventarioSede } from '../../models/types'

type FiltroMovimiento = 'todos' | 'entrada' | 'salida' | 'merma_ajuste'

const filtros: { key: FiltroMovimiento; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'entrada', label: 'Entradas' },
  { key: 'salida', label: 'Salidas por venta' },
  { key: 'merma_ajuste', label: 'Mermas y ajustes' },
]

export const tiposAjuste: { key: 'merma' | 'ajuste'; label: string }[] = [
  { key: 'merma', label: 'Merma (salida)' },
  { key: 'ajuste', label: 'Corrección (entrada)' },
]

export const motivosAjuste = ['Vencido', 'Dañado', 'Error de conteo', 'Otro']

export function useMovimientos() {
  const { usuario } = useUsuario()
  const [movimientos, setMovimientos] = useState<MovimientoConDetalle[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [inventario, setInventario] = useState<InventarioSede[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroMovimiento>('todos')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [insumoId, setInsumoId] = useState('')
  const [tipoAjuste, setTipoAjuste] = useState<'merma' | 'ajuste'>('merma')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState(motivosAjuste[0])
  const [nota, setNota] = useState('')

  function cargar() {
    if (!usuario?.sede_id) return Promise.resolve()
    return Promise.all([
      fetchMovimientos(usuario.tenant_id, usuario.sede_id),
      fetchInsumos(usuario.tenant_id),
      fetchInventarioSede(usuario.tenant_id, usuario.sede_id),
    ]).then(([movimientosData, insumosData, inventarioData]) => {
      setMovimientos(movimientosData)
      setInsumos(insumosData)
      setInventario(inventarioData)
    })
  }

  useEffect(() => {
    if (!usuario?.sede_id) return
    let cancelado = false
    setLoading(true)
    cargar()
      .then(() => {
        if (!cancelado) setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelado) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los movimientos')
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.tenant_id, usuario?.sede_id])

  const movimientosFiltrados = movimientos.filter((m) => {
    const coincideFiltro =
      filtro === 'todos' ||
      (filtro === 'entrada' && m.tipo === 'entrada') ||
      (filtro === 'salida' && m.tipo === 'salida') ||
      (filtro === 'merma_ajuste' && (m.tipo === 'merma' || m.tipo === 'ajuste'))
    const coincideBusqueda = m.insumo.toLowerCase().includes(busqueda.toLowerCase())
    return coincideFiltro && coincideBusqueda
  })

  const hoy = new Date().toDateString()
  const movimientosHoy = movimientos.filter((m) => new Date(m.fecha).toDateString() === hoy)

  const stockDisponible = inventario.find((i) => i.insumo_id === insumoId)?.cantidad_actual ?? 0
  const cantidadNumero = Number(cantidad) || 0
  const excedeStock = tipoAjuste === 'merma' && cantidadNumero > stockDisponible

  function abrirNuevo() {
    setInsumoId('')
    setTipoAjuste('merma')
    setCantidad('')
    setMotivo(motivosAjuste[0])
    setNota('')
    setError(null)
    setModalAbierto(true)
  }

  // Un movimiento no se edita (rompería la trazabilidad y desincronizaría
  // inventario_sede del valor ya aplicado) — se revierte con el ajuste
  // contrario, precargado para no tener que calcularlo a mano. Solo tiene
  // sentido para merma/ajuste: entrada/salida son siempre automáticos
  // (trigger de entrega, lote, o compra recibida) y revertirlos aquí
  // desincronizaría lotes_insumo o la orden de compra de origen.
  function revertir(mov: MovimientoConDetalle) {
    setInsumoId(mov.insumo_id)
    setTipoAjuste(mov.tipo === 'merma' ? 'ajuste' : 'merma')
    setCantidad(String(mov.cantidad))
    setMotivo('Error de conteo')
    setNota(
      `Revierte un ${mov.tipo === 'merma' ? 'merma' : 'ajuste'} de ${mov.cantidad} ${mov.unidad} del ${new Date(mov.fecha).toLocaleDateString('es-VE')}`,
    )
    setError(null)
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
  }

  async function registrar() {
    if (!usuario?.sede_id || !insumoId || cantidadNumero <= 0 || excedeStock) return
    setGuardando(true)
    setError(null)
    try {
      await registrarAjusteManual({
        tenant_id: usuario.tenant_id,
        sede_id: usuario.sede_id,
        insumo_id: insumoId,
        tipo: tipoAjuste,
        cantidad: cantidadNumero,
        motivo,
        nota,
        creado_por: usuario.id,
      })
      await cargar()
      setInsumoId('')
      setCantidad('')
      setNota('')
      setModalAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el ajuste')
      throw err
    } finally {
      setGuardando(false)
    }
  }

  return {
    loading,
    error,
    guardando,
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    filtros,
    movimientos: movimientosFiltrados,
    totales: {
      total: movimientosHoy.length,
      salidasPorVenta: movimientosHoy.filter((m) => m.tipo === 'salida').length,
      mermas: movimientosHoy.filter((m) => m.tipo === 'merma').length,
    },
    insumos,
    modalAbierto,
    abrirNuevo,
    revertir,
    cerrarModal,
    insumoId,
    setInsumoId,
    tipoAjuste,
    setTipoAjuste,
    tiposAjuste,
    cantidad,
    setCantidad,
    motivo,
    setMotivo,
    motivosAjuste,
    nota,
    setNota,
    stockDisponible,
    excedeStock,
    registrar,
  }
}
