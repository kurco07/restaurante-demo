import { useState } from 'react'
import type { EstadoOrdenCompra, OrdenCompra } from '../../models/types'
import { ordenesCompra, resumenComprasMes } from './mockData/compras'

export type FiltroCompras = 'todas' | EstadoOrdenCompra

export const filtrosCompras: { key: FiltroCompras; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'borrador', label: 'Borrador' },
  { key: 'pendiente', label: 'Pendiente de aprobación' },
  { key: 'aprobada', label: 'Aprobada' },
  { key: 'rechazada', label: 'Rechazada' },
  { key: 'recibida', label: 'Recibida' },
]

export function totalOrden(orden: OrdenCompra) {
  return orden.items.reduce((suma, item) => suma + item.cantidad * item.costoUnitario, 0)
}

export function useCompras() {
  const [filtro, setFiltro] = useState<FiltroCompras>('todas')
  const [seleccionadaId, setSeleccionadaId] = useState('oc-0142')

  return {
    filtro,
    setFiltro,
    ordenesFiltradas: ordenesCompra.filter((o) => filtro === 'todas' || o.estado === filtro),
    seleccionada: ordenesCompra.find((o) => o.id === seleccionadaId) ?? null,
    seleccionar: setSeleccionadaId,
    resumen: {
      ...resumenComprasMes,
      pendientes: ordenesCompra.filter((o) => o.estado === 'pendiente').length,
    },
  }
}
