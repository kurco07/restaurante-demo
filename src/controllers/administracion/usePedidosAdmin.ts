import { useMemo, useState } from 'react'
import type { EstadoPedidoAdmin } from '../../models/types'
import { pedidosAdminMock, totalesHoy } from './mockData/pedidosAdmin'

type FiltroPedido = 'todos' | EstadoPedidoAdmin

const filtros: { key: FiltroPedido; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'cocina', label: 'En cocina' },
  { key: 'listo', label: 'Listo para servir' },
  { key: 'cuenta', label: 'Cuenta pedida' },
  { key: 'entregado', label: 'Entregado' },
  { key: 'cancelado', label: 'Cancelado' },
]

export function usePedidosAdmin() {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroPedido>('todos')
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>('107')

  const pedidos = useMemo(() => {
    return pedidosAdminMock.filter((p) => {
      const coincideFiltro = filtro === 'todos' || p.estado === filtro
      const etiquetaMesa = p.mesaNumero !== null ? `mesa ${p.mesaNumero}` : 'para llevar'
      const coincideBusqueda =
        etiquetaMesa.includes(busqueda.toLowerCase()) || p.mesonero.toLowerCase().includes(busqueda.toLowerCase())
      return coincideFiltro && coincideBusqueda
    })
  }, [busqueda, filtro])

  const seleccionado = pedidosAdminMock.find((p) => p.id === seleccionadoId) ?? null

  return {
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    filtros,
    pedidos,
    totalPedidosHoy: totalesHoy.pedidos,
    seleccionado,
    setSeleccionadoId,
    totales: totalesHoy,
  }
}
