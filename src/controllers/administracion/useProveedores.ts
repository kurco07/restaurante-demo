import { useMemo, useState } from 'react'
import { categoriasProveedor, proveedoresMock } from './mockData/proveedores'

export function useProveedores() {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>('PA')

  const proveedores = useMemo(() => {
    return proveedoresMock.filter((p) => {
      const coincideCategoria = categoria === 'Todas' || p.categoria === categoria
      const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return coincideCategoria && coincideBusqueda
    })
  }, [busqueda, categoria])

  const seleccionado = proveedoresMock.find((p) => p.id === seleccionadoId) ?? null

  return {
    busqueda,
    setBusqueda,
    categoria,
    setCategoria,
    categorias: categoriasProveedor,
    proveedores,
    seleccionado,
    setSeleccionadoId,
    totales: {
      registrados: proveedoresMock.length,
      insumosCubiertos: proveedoresMock.reduce((acc, p) => acc + p.insumos.length, 0),
      inactivos: proveedoresMock.filter((p) => !p.activo).length,
    },
  }
}
