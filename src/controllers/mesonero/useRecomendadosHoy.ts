import { useEffect, useState } from 'react'
import { fetchRecomendadosHoy } from '../../models/services/recomendadosService'
import type { RecomendadosHoy } from '../../models/types'
import { useEstadoConexion } from '../useEstadoConexion'

const CADA_MS = 60_000

function hoy() {
  return new Date().toDateString()
}

function claveCache(sedeId: string) {
  return `recomendados:${sedeId}`
}

// La última lista guardada en este dispositivo, solo si es de hoy
function leerCache(sedeId: string): RecomendadosHoy | null {
  try {
    const crudo = localStorage.getItem(claveCache(sedeId))
    if (!crudo) return null
    const { dia, lista } = JSON.parse(crudo) as { dia: string; lista: RecomendadosHoy | null }
    return dia === hoy() ? lista : null
  } catch {
    return null
  }
}

function guardarCache(sedeId: string, lista: RecomendadosHoy | null) {
  try {
    localStorage.setItem(claveCache(sedeId), JSON.stringify({ dia: hoy(), lista }))
  } catch {
    // Sin almacenamiento (modo privado): no pasa nada, se vuelve a pedir
  }
}

// Recomendados del día para el mesonero (Fase 6, Módulo 4). El mesonero
// tiene que funcionar sin internet y esto lo arma el servidor, así que se
// pide al entrar, cada minuto, al volver a la pestaña y al volver la
// conexión, y la última lista de hoy queda guardada en el dispositivo: sin
// red se sigue viendo la que llegó. Tomar pedidos no depende de esto.
export function useRecomendadosHoy(sedeId: string | null) {
  const { conectado } = useEstadoConexion()
  const [lista, setLista] = useState<RecomendadosHoy | null>(() => (sedeId ? leerCache(sedeId) : null))

  useEffect(() => {
    if (!sedeId || !conectado) return
    let cancelado = false
    const pedir = () =>
      fetchRecomendadosHoy()
        .then((r) => {
          if (cancelado) return
          setLista(r)
          guardarCache(sedeId, r)
        })
        .catch(() => {
          // Sin red o error puntual: se conserva la última lista
        })
    pedir()
    const intervalo = setInterval(pedir, CADA_MS)
    const alVolver = () => {
      if (document.visibilityState === 'visible') pedir()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      cancelado = true
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [sedeId, conectado])

  return lista
}
