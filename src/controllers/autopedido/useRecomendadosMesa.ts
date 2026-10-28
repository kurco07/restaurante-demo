import { useEffect, useState } from 'react'
import { fetchRecomendadosMesa } from '../../models/services/recomendadosService'
import type { RecomendadosHoy } from '../../models/types'

// Recomendados del día en el autopedido QR (Fase 6, Módulo 4): los de la
// sede de esa mesa, plato y frase, sin precios. Se piden una vez al abrir
// el menú; si fallan, el menú se ve igual, solo que sin la franja.
export function useRecomendadosMesa(mesaId: string | undefined) {
  const [lista, setLista] = useState<RecomendadosHoy | null>(null)

  useEffect(() => {
    if (!mesaId) return
    let cancelado = false
    fetchRecomendadosMesa(mesaId)
      .then((r) => {
        if (!cancelado) setLista(r)
      })
      .catch(() => {
        // Sin recomendados: no es motivo para romper el menú
      })
    return () => {
      cancelado = true
    }
  }, [mesaId])

  return lista
}
