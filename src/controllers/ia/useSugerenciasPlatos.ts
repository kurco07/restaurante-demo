import { useCallback, useEffect, useState } from 'react'
import {
  aprobarSugerenciaPlatos,
  fetchSugerenciasPlatos,
  generarSugerenciaPlatos,
} from '../../models/services/sugerenciaPlatosService'
import { rechazarSugerencia } from '../../models/services/sugerenciaCompraService'
import type { PlatoAprobado, SugerenciaPlatos } from '../../models/types'

function mensaje(e: unknown) {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return String(e)
}

// Platos a preparar de una sede, para gerencia (Fase 6, Módulo 3):
// generar con la IA, revisar, aprobar (cocina la ve) o rechazar.
// sedeId nulo = gerencia no eligió sede todavía.
export function useSugerenciasPlatos(sedeId: string | null) {
  const [sugerencias, setSugerencias] = useState<SugerenciaPlatos[]>([])
  const [cargando, setCargando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!sedeId) {
      setSugerencias([])
      return
    }
    setSugerencias(await fetchSugerenciasPlatos(sedeId))
  }, [sedeId])

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    setAviso(null)
    cargar()
      .catch((e: unknown) => {
        if (!cancelado) setError(mensaje(e))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [cargar])

  async function generar() {
    if (!sedeId) return
    setGenerando(true)
    setError(null)
    setAviso(null)
    try {
      const r = await generarSugerenciaPlatos(sedeId)
      if (!r.ok) {
        setError(r.mensaje)
        return
      }
      if (!r.sugerenciaId) setAviso(r.mensaje ?? 'No hay platos para sugerir.')
      await cargar()
    } catch (e) {
      setError(mensaje(e))
    } finally {
      setGenerando(false)
    }
  }

  async function aprobar(id: string, items: PlatoAprobado[]) {
    setGuardando(true)
    setError(null)
    setAviso(null)
    try {
      await aprobarSugerenciaPlatos(id, items)
      setAviso('Lista aprobada: cocina ya la ve como "Platos sugeridos para hoy".')
      await cargar()
    } catch (e) {
      setError(mensaje(e))
    } finally {
      setGuardando(false)
    }
  }

  async function rechazar(id: string, motivo: string) {
    setGuardando(true)
    setError(null)
    setAviso(null)
    try {
      await rechazarSugerencia(id, motivo)
      setAviso('Sugerencia rechazada.')
      await cargar()
    } catch (e) {
      setError(mensaje(e))
    } finally {
      setGuardando(false)
    }
  }

  return {
    pendientes: sugerencias.filter((s) => s.estado === 'pendiente'),
    revisadas: sugerencias.filter((s) => s.estado !== 'pendiente'),
    cargando,
    generando,
    guardando,
    error,
    aviso,
    generar,
    aprobar,
    rechazar,
  }
}
