import { useCallback, useEffect, useState } from 'react'
import {
  aprobarRecomendados,
  fetchSugerenciasRecomendados,
  generarRecomendados,
} from '../../models/services/recomendadosService'
import { rechazarSugerencia } from '../../models/services/sugerenciaCompraService'
import type { RecomendadoAprobado, SugerenciaRecomendados } from '../../models/types'

function mensaje(e: unknown) {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return String(e)
}

// Recomendados del día de una sede, para gerencia (Fase 6, Módulo 4):
// generar con la IA, revisar (y editar la frase), aprobar o rechazar.
// sedeId nulo = gerencia no eligió sede todavía.
export function useSugerenciasRecomendados(sedeId: string | null) {
  const [sugerencias, setSugerencias] = useState<SugerenciaRecomendados[]>([])
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
    setSugerencias(await fetchSugerenciasRecomendados(sedeId))
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
      const r = await generarRecomendados(sedeId)
      if (!r.ok) {
        setError(r.mensaje)
        return
      }
      if (!r.sugerenciaId) setAviso(r.mensaje ?? 'No hay platos para recomendar.')
      await cargar()
    } catch (e) {
      setError(mensaje(e))
    } finally {
      setGenerando(false)
    }
  }

  async function aprobar(id: string, items: RecomendadoAprobado[]) {
    setGuardando(true)
    setError(null)
    setAviso(null)
    try {
      await aprobarRecomendados(id, items)
      setAviso('Recomendados publicados: ya se ven en el menú del mesonero y en el QR de las mesas.')
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
      setAviso('Recomendados rechazados.')
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
