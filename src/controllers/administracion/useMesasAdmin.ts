import { useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { actualizarMesa, crearMesa, eliminarMesa, fetchMesas } from '../../models/services/mesaService'
import type { Mesa } from '../../models/types'
import { mensajeDeError } from '../../lib/errores'

type Filtro = 'todas' | 'libre' | 'ocupada' | 'por_limpiar'

const filtros: { key: Filtro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'libre', label: 'Libres' },
  { key: 'ocupada', label: 'Ocupadas' },
  { key: 'por_limpiar', label: 'Por limpiar' },
]

function coincideFiltro(mesa: Mesa, filtro: Filtro) {
  return filtro === 'todas' || mesa.estado === filtro
}

export function useMesasAdmin() {
  const { usuario } = useUsuario()
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!usuario?.sede_id) return
    let cancelado = false
    setLoading(true)
    fetchMesas(usuario.tenant_id, usuario.sede_id)
      .then((data) => {
        if (cancelado) return
        setMesas(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelado) return
        setError(mensajeDeError(err, 'No se pudieron cargar las mesas'))
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [usuario?.tenant_id, usuario?.sede_id])

  async function agregarMesa(posicionX: number, posicionY: number) {
    if (!usuario?.sede_id) return
    setGuardando(true)
    try {
      const nueva = await crearMesa({
        tenant_id: usuario.tenant_id,
        sede_id: usuario.sede_id,
        nombre_numero: String(mesas.length + 1),
        posicion_x: posicionX,
        posicion_y: posicionY,
      })
      setMesas((prev) => [...prev, nueva])
      setSeleccionadaId(nueva.id)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo crear la mesa'))
    } finally {
      setGuardando(false)
    }
  }

  async function guardarMesa(
    id: string,
    cambios: { nombre_numero: string; posicion_x: number | null; posicion_y: number | null },
  ) {
    setGuardando(true)
    try {
      const actualizada = await actualizarMesa(id, cambios)
      setMesas((prev) => prev.map((m) => (m.id === id ? actualizada : m)))
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar la mesa'))
    } finally {
      setGuardando(false)
    }
  }

  // Reposicionar por arrastre es más frecuente que editar texto — se
  // guarda directo sin pasar por el flujo de "guardando" del formulario,
  // así el arrastre se siente inmediato.
  async function moverMesa(id: string, posicionX: number, posicionY: number) {
    try {
      const actualizada = await actualizarMesa(id, { posicion_x: posicionX, posicion_y: posicionY })
      setMesas((prev) => prev.map((m) => (m.id === id ? actualizada : m)))
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo mover la mesa'))
    }
  }

  async function borrarMesa(id: string) {
    setGuardando(true)
    try {
      await eliminarMesa(id)
      setMesas((prev) => prev.filter((m) => m.id !== id))
      setSeleccionadaId((actual) => (actual === id ? null : actual))
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar la mesa'))
    } finally {
      setGuardando(false)
    }
  }

  const contador = (f: Filtro) => mesas.filter((m) => coincideFiltro(m, f)).length

  return {
    mesas,
    loading,
    error,
    filtro,
    setFiltro,
    filtros,
    contador,
    coincideFiltro: (mesa: Mesa) => coincideFiltro(mesa, filtro),
    seleccionadaId,
    setSeleccionadaId,
    mesaSeleccionada: mesas.find((m) => m.id === seleccionadaId) ?? null,
    guardando,
    agregarMesa,
    guardarMesa,
    moverMesa,
    borrarMesa,
    totales: {
      total: mesas.length,
      ocupadas: mesas.filter((m) => m.estado === 'ocupada').length,
      porLimpiar: mesas.filter((m) => m.estado === 'por_limpiar').length,
    },
  }
}
