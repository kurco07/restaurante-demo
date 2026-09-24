import { useMemo, useState } from 'react'
import type { TipoMovimiento } from '../../models/types'
import { motivosAjuste, movimientosMock, totalesMovimientosHoy } from './mockData/movimientos'

type FiltroMovimiento = 'todos' | 'entrada' | 'salida' | 'merma'

const filtros: { key: FiltroMovimiento; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'entrada', label: 'Entradas' },
  { key: 'salida', label: 'Salidas por venta' },
  { key: 'merma', label: 'Mermas y ajustes' },
]

const tiposAjuste: { key: 'merma' | 'entrada'; label: string }[] = [
  { key: 'merma', label: 'Merma (salida)' },
  { key: 'entrada', label: 'Corrección (entrada)' },
]

export function useMovimientos() {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroMovimiento>('todos')
  const [tipoAjuste, setTipoAjuste] = useState<TipoMovimiento>('merma')
  const [motivo, setMotivo] = useState(motivosAjuste[0])

  const movimientos = useMemo(() => {
    return movimientosMock.filter((m) => {
      const coincideFiltro = filtro === 'todos' || m.tipo === filtro
      const coincideBusqueda = m.insumo.toLowerCase().includes(busqueda.toLowerCase())
      return coincideFiltro && coincideBusqueda
    })
  }, [busqueda, filtro])

  return {
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    filtros,
    movimientos,
    totales: totalesMovimientosHoy,
    tipoAjuste,
    setTipoAjuste,
    tiposAjuste,
    motivo,
    setMotivo,
    motivosAjuste,
  }
}
