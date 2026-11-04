import { useEffect, useState } from 'react'
import { powerSync } from '../lib/powerSyncClient'

// Si este dispositivo ya bajó alguna vez los datos completos del servidor
// (Fase 8, Módulo 2). En un dispositivo nuevo, o después de borrar los
// datos del sitio, la primera sincronización tarda: mientras tanto una
// lista vacía NO quiere decir "no hay nada", y las pantallas lo dicen.
// Un dispositivo que ya sincronizó antes lo sigue sabiendo sin internet.
export function useSincronizado(): boolean {
  const [sincronizado, setSincronizado] = useState(() => powerSync.currentStatus.hasSynced === true)

  useEffect(
    () =>
      powerSync.registerListener({
        statusChanged: (status) => setSincronizado(status.hasSynced === true),
      }),
    [],
  )

  return sincronizado
}
