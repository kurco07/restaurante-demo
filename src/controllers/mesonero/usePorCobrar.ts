import { useCallback, useEffect, useState } from 'react'

// Mesas que el mesonero quiso cobrar sin internet (Fase 8, Módulo 1).
// Cobrar necesita conexión: el pago se registra directo en el servidor
// (decisión de Pedro, 2026-10-30: no se cobra offline, pero se avisa
// claro). Para que no se olvide, la mesa queda marcada "por cobrar" en
// ESTE dispositivo hasta que se cobre. Es un recordatorio local, no un
// estado de la mesa: no sube al servidor.

const CLAVE = 'mesas-por-cobrar'
const EVENTO = 'mesas-por-cobrar-cambio'

function leer(): string[] {
  try {
    const crudo = localStorage.getItem(CLAVE)
    return crudo ? (JSON.parse(crudo) as string[]) : []
  } catch {
    return []
  }
}

function guardar(ids: string[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ids))
  } catch {
    // Sin almacenamiento: el recordatorio dura solo esta sesión
  }
  window.dispatchEvent(new Event(EVENTO))
}

export function usePorCobrar() {
  const [ids, setIds] = useState<string[]>(leer)

  useEffect(() => {
    const actualizar = () => setIds(leer())
    window.addEventListener(EVENTO, actualizar)
    window.addEventListener('storage', actualizar)
    return () => {
      window.removeEventListener(EVENTO, actualizar)
      window.removeEventListener('storage', actualizar)
    }
  }, [])

  const marcar = useCallback((mesaId: string) => {
    const actuales = leer()
    if (!actuales.includes(mesaId)) guardar([...actuales, mesaId])
  }, [])

  const quitar = useCallback((mesaId: string) => {
    guardar(leer().filter((id) => id !== mesaId))
  }, [])

  return { ids, marcar, quitar }
}
