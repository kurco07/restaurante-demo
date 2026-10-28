import { useEffect, useState } from 'react'
import { fetchPlatosSugeridosHoy } from '../../models/services/sugerenciaPlatosService'
import type { PlatosSugeridosHoy } from '../../models/types'
import { useEstadoConexion } from '../useEstadoConexion'

const CADA_MS = 60_000

// Platos sugeridos para hoy en la pantalla de cocina (Fase 6, Módulo 3).
// Es lo único de cocina que necesita red (lo arma el servidor, sin
// precios): se pide al entrar, cada minuto, al volver a la pestaña y al
// volver la conexión. Sin
// internet se queda con la última lista que llegó, y si nunca llegó
// ninguna simplemente no se muestra: el tablero de pedidos no depende de
// esto y sigue funcionando offline (CLAUDE.md).
export function usePlatosSugeridosHoy() {
  const { conectado } = useEstadoConexion()
  const [lista, setLista] = useState<PlatosSugeridosHoy | null>(null)

  useEffect(() => {
    if (!conectado) return
    let cancelado = false
    const pedir = () =>
      fetchPlatosSugeridosHoy()
        .then((r) => {
          if (!cancelado) setLista(r)
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
  }, [conectado])

  return lista
}
