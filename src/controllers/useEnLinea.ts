import { useEffect, useState } from 'react'

// Si el navegador tiene red (Fase 8, Módulo 2). Para las secciones que
// hablan directo con Supabase (administración, gerencia); mesonero y
// cocina miran a PowerSync con useEstadoConexion.
export function useEnLinea(): boolean {
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false))

  useEffect(() => {
    const prender = () => setEnLinea(true)
    const apagar = () => setEnLinea(false)
    window.addEventListener('online', prender)
    window.addEventListener('offline', apagar)
    return () => {
      window.removeEventListener('online', prender)
      window.removeEventListener('offline', apagar)
    }
  }, [])

  return enLinea
}
