import { useEffect, useMemo, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import type { EstadoPedidoAdmin } from '../../models/types'
import { fetchPedidosAdminDia } from '../../models/services/pedidosAdminService'
import { anularSesionCompleta } from '../../models/services/pedidoService'
import { mensajeDeError } from '../../lib/errores'

type FiltroPedido = 'todos' | EstadoPedidoAdmin

const filtros: { key: FiltroPedido; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'cocina', label: 'En cocina' },
  { key: 'listo', label: 'Listo para servir' },
  { key: 'entregado', label: 'Entregado' },
  { key: 'cancelado', label: 'Cancelado' },
]

function inicioDelDia() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
}

export function usePedidosAdmin() {
  const { usuario } = useUsuario()
  const [pedidosHoy, setPedidosHoy] = useState<Awaited<ReturnType<typeof fetchPedidosAdminDia>>>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroPedido>('todos')
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)

  function cargar() {
    if (!usuario?.sede_id) return Promise.resolve()
    return fetchPedidosAdminDia(usuario.sede_id, inicioDelDia()).then(setPedidosHoy)
  }

  useEffect(() => {
    if (!usuario?.sede_id) return
    let cancelado = false
    setCargando(true)
    cargar()
      .then(() => {
        if (!cancelado) setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(mensajeDeError(e, 'No se pudieron cargar los pedidos'))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [usuario?.sede_id])

  const pedidos = useMemo(() => {
    return pedidosHoy.filter((p) => {
      const coincideFiltro = filtro === 'todos' || p.estado === filtro
      const etiquetaMesa = `mesa ${p.mesaNumero}`.toLowerCase()
      const coincideBusqueda =
        etiquetaMesa.includes(busqueda.toLowerCase()) || p.mesonero.toLowerCase().includes(busqueda.toLowerCase())
      return coincideFiltro && coincideBusqueda
    })
  }, [pedidosHoy, busqueda, filtro])

  const seleccionado = pedidosHoy.find((p) => p.id === seleccionadoId) ?? null

  const demorados = pedidosHoy.filter((p) => p.estado === 'cocina').length
  const ticketPromedio = pedidosHoy.length
    ? pedidosHoy.reduce((acc, p) => acc + p.total, 0) / pedidosHoy.length
    : 0

  // Reutiliza la misma anulación que ya tiene supervisor (migración 0015:
  // valida en la base que los platos entregados no se puedan anular).
  async function cancelarPedido(sesionId: string, motivo: string) {
    setCancelando(true)
    try {
      await anularSesionCompleta(sesionId, motivo)
      await cargar()
      setSeleccionadoId(null)
    } finally {
      setCancelando(false)
    }
  }

  return {
    cargando,
    error,
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    filtros,
    pedidos,
    totalPedidosHoy: pedidosHoy.length,
    seleccionado,
    setSeleccionadoId,
    totales: { ticketPromedio, demorados },
    cancelarPedido,
    cancelando,
  }
}
