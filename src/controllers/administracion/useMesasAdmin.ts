import { useState } from 'react'
import { mesasAdminMock } from './mockData/mesasAdmin'

type Filtro = 'todas' | 'libres' | 'ocupadas' | 'demoradas'

const filtros: { key: Filtro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'libres', label: 'Libres' },
  { key: 'ocupadas', label: 'Ocupadas' },
  { key: 'demoradas', label: 'Demoradas' },
]

function coincideFiltro(mesa: (typeof mesasAdminMock)[number], filtro: Filtro) {
  if (filtro === 'todas') return true
  if (filtro === 'libres') return mesa.estado === 'libre'
  if (filtro === 'ocupadas') return mesa.estado === 'ocupada'
  return Boolean(mesa.demorada)
}

export function useMesasAdmin() {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [editando, setEditando] = useState(false)
  const [seleccionada, setSeleccionada] = useState<number | null>(7)

  const contador = (f: Filtro) => mesasAdminMock.filter((m) => coincideFiltro(m, f)).length

  return {
    mesas: mesasAdminMock,
    filtro,
    setFiltro,
    filtros,
    contador,
    coincideFiltro: (mesa: (typeof mesasAdminMock)[number]) => coincideFiltro(mesa, filtro),
    editando,
    setEditando,
    seleccionada,
    setSeleccionada,
    mesaSeleccionada: mesasAdminMock.find((m) => m.numero === seleccionada) ?? null,
    totales: {
      total: mesasAdminMock.length,
      ocupadas: mesasAdminMock.filter((m) => m.estado === 'ocupada').length,
      demoradas: mesasAdminMock.filter((m) => m.demorada).length,
    },
  }
}
