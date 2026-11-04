import { useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { actualizarSedePropia, fetchSedePropia } from '../../models/services/sedeService'
import type { SedeConfig } from '../../models/types'

// Configuración de Administración (lo básico): datos de la sede propia,
// facturación (impuesto/propina) y preferencias de notificación — todo
// en la tabla sedes (migración 0034). "Guardar cambios" ya no es un solo
// botón compartido: cada sección guarda la suya, mismo criterio que
// Colores de marca (ConfiguracionPage.tsx).
export function useConfiguracion() {
  const { usuario } = useUsuario()
  const [sede, setSede] = useState<SedeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function cargar() {
    if (!usuario?.sede_id) return Promise.resolve()
    return fetchSedePropia(usuario.sede_id).then(setSede)
  }

  useEffect(() => {
    if (!usuario?.sede_id) return
    let cancelado = false
    setLoading(true)
    cargar()
      .then(() => {
        if (!cancelado) setError(null)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudo cargar la configuración')
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [usuario?.sede_id])

  async function guardar(cambios: Partial<SedeConfig>) {
    if (!usuario?.sede_id) return
    await actualizarSedePropia(usuario.sede_id, cambios)
    await cargar()
  }

  return { sede, loading, error, guardar }
}
