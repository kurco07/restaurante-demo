import { useState } from 'react'
import type { InsumoAdmin } from '../../models/types'
import { categoriasInsumo, insumos, totalInsumosRegistrados } from './mockData/insumos'

export const TODAS = 'Todas'

export function estaBajoStock(insumo: InsumoAdmin) {
  return insumo.stockActual < insumo.stockMinimo
}

export function useInsumosAdmin() {
  const [categoria, setCategoria] = useState(TODAS)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionadoId, setSeleccionadoId] = useState('pan-hamburguesa')

  const q = busqueda.trim().toLowerCase()
  const insumosFiltrados = insumos.filter(
    (i) => (categoria === TODAS || i.categoria === categoria) && (!q || i.nombre.toLowerCase().includes(q)),
  )

  return {
    categorias: [TODAS, ...categoriasInsumo],
    categoria,
    setCategoria,
    busqueda,
    setBusqueda,
    insumosFiltrados,
    seleccionado: insumos.find((i) => i.id === seleccionadoId) ?? null,
    seleccionar: setSeleccionadoId,
    resumen: {
      registrados: totalInsumosRegistrados,
      categorias: categoriasInsumo.length,
      bajoStock: insumos.filter(estaBajoStock).length,
    },
  }
}
