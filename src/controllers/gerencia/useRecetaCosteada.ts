import { useEffect, useState } from 'react'
import type { IngredienteCosteado } from '../../models/types'
import { fetchRecetaCosteada } from '../../models/services/kpisService'

// Receta de un plato con el costo de cada insumo, para la ficha de solo
// lectura de gerencia. Gerencia no edita recetas: eso es de administración.
// Costos de la sede elegida en el panel, o de cualquiera si son todas.
// El componente que la usa se monta con key={menuItemId}, así que cada
// plato arranca con estado limpio.
export function useRecetaCosteada(menuItemId: string, sedeId?: string) {
  const [ingredientes, setIngredientes] = useState<IngredienteCosteado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    fetchRecetaCosteada(menuItemId, sedeId)
      .then((filas) => {
        if (!cancelado) setIngredientes(filas)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [menuItemId, sedeId])

  const costoTotal = ingredientes.reduce((s, i) => s + (i.subtotal ?? 0), 0)
  const completo = ingredientes.length > 0 && ingredientes.every((i) => i.costo_unitario != null)

  return { ingredientes, cargando, error, costoTotal, completo }
}
