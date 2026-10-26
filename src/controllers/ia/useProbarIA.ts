import { useState } from 'react'
import type { ResultadoPruebaIA } from '../../models/types'
import { probarIA } from '../../models/services/iaService'

// Botón "Probar conexión" de la página de Sugerencias IA: no se llama
// solo al abrir la página, para no gastar la cuota gratuita de Gemini.
export function useProbarIA() {
  const [resultado, setResultado] = useState<ResultadoPruebaIA | null>(null)
  const [probando, setProbando] = useState(false)

  async function probar() {
    setProbando(true)
    try {
      setResultado(await probarIA())
    } finally {
      setProbando(false)
    }
  }

  return { resultado, probando, probar }
}
