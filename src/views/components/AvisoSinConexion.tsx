import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useEnLinea } from '../../controllers/useEnLinea'

// Secciones que necesitan internet a propósito (arquitectura.md §1): sin
// red no funcionan, y en vez de que cada pantalla falle por su lado con
// "Failed to fetch", se avisa una sola vez arriba (Fase 8, Módulo 2).
const SECCIONES_EN_LINEA = ['/administracion', '/gerencia', '/super-admin']

export function AvisoSinConexion() {
  const { pathname } = useLocation()
  const enLinea = useEnLinea()
  // Volvió la red después de un corte: lo que está en pantalla puede ser
  // viejo. No se recarga solo para no perder un formulario a medio llenar.
  const [volvio, setVolvio] = useState(false)
  const [huboCorte, setHuboCorte] = useState(false)

  useEffect(() => {
    if (!enLinea) {
      setHuboCorte(true)
      setVolvio(false)
    } else if (huboCorte) {
      setVolvio(true)
      setHuboCorte(false)
    }
  }, [enLinea, huboCorte])

  if (!SECCIONES_EN_LINEA.some((s) => pathname.startsWith(s))) return null

  if (!enLinea) {
    return (
      <div role="alert" className="bg-[var(--red)] px-4 py-2 text-center text-sm font-bold text-white">
        Sin conexión: esta sección necesita internet. Lo que ves puede no estar actualizado y no se puede guardar
        nada hasta que vuelva la red.
      </div>
    )
  }

  if (volvio) {
    return (
      <div role="status" className="flex items-center justify-center gap-3 bg-[var(--green)] px-4 py-2 text-sm text-white">
        <span className="font-bold">Volvió la conexión.</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-white px-3 py-1 font-bold text-[var(--green)]"
        >
          Actualizar datos
        </button>
        <button
          type="button"
          onClick={() => setVolvio(false)}
          aria-label="Cerrar"
          className="px-1 font-bold opacity-80 hover:opacity-100"
        >
          ×
        </button>
      </div>
    )
  }

  return null
}
