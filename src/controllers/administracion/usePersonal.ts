import { useEffect, useMemo, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import type { Empleado, Rol } from '../../models/types'
import { fetchEmpleados, gestionarEmpleado, resetearContrasena } from '../../models/services/empleadoService'

type FiltroRol = 'todos' | Rol

const filtros: { key: FiltroRol; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'mesonero', label: 'Mesoneros' },
  { key: 'cocina', label: 'Cocina' },
  { key: 'supervisor', label: 'Supervisores' },
  { key: 'administracion', label: 'Administración' },
  { key: 'gerencia', label: 'Gerencia' },
]

export function usePersonal() {
  const { usuario } = useUsuario()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroRol>('todos')
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const [actuando, setActuando] = useState(false)

  function cargar() {
    if (!usuario?.sede_id) return Promise.resolve()
    return fetchEmpleados(usuario.sede_id).then(setEmpleados)
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
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudieron cargar los empleados')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [usuario?.sede_id])

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((e) => {
      const coincideFiltro = filtro === 'todos' || e.rol === filtro
      const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return coincideFiltro && coincideBusqueda
    })
  }, [empleados, busqueda, filtro])

  const seleccionado = empleados.find((e) => e.id === seleccionadoId) ?? null

  async function activarODesactivar(id: string, activo: boolean) {
    setActuando(true)
    try {
      await gestionarEmpleado(id, activo ? 'activar' : 'desactivar')
      await cargar()
    } finally {
      setActuando(false)
    }
  }

  async function eliminar(id: string) {
    setActuando(true)
    try {
      await gestionarEmpleado(id, 'eliminar')
      setSeleccionadoId(null)
      await cargar()
    } finally {
      setActuando(false)
    }
  }

  async function resetearContrasenaDe(id: string, nueva: string) {
    setActuando(true)
    try {
      await resetearContrasena(id, nueva)
    } finally {
      setActuando(false)
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
    empleados: empleadosFiltrados,
    seleccionado,
    setSeleccionadoId,
    actuando,
    activarODesactivar,
    eliminar,
    resetearContrasenaDe,
    totales: {
      registrados: empleados.length,
      activos: empleados.filter((e) => e.activo).length,
      inactivos: empleados.filter((e) => !e.activo).length,
    },
  }
}
