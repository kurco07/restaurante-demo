import { useMemo, useState } from 'react'
import type { PuestoEmpleado } from '../../models/types'
import { empleadosMock } from './mockData/personal'

type FiltroPuesto = 'todos' | PuestoEmpleado

const filtros: { key: FiltroPuesto; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'mesonero', label: 'Mesoneros' },
  { key: 'cocinero', label: 'Cocineros' },
  { key: 'administracion', label: 'Administradores' },
]

export function usePersonal() {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroPuesto>('todos')
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>('2')

  const empleados = useMemo(() => {
    return empleadosMock.filter((e) => {
      const coincideFiltro = filtro === 'todos' || e.puesto === filtro
      const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return coincideFiltro && coincideBusqueda
    })
  }, [busqueda, filtro])

  const seleccionado = empleadosMock.find((e) => e.id === seleccionadoId) ?? null

  return {
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    filtros,
    empleados,
    seleccionado,
    setSeleccionadoId,
    totales: {
      registrados: empleadosMock.length,
      activos: empleadosMock.filter((e) => e.activo).length,
      inactivos: empleadosMock.filter((e) => !e.activo).length,
    },
  }
}
