import { useEffect, useState } from 'react'
import { powerSync } from '../lib/powerSyncClient'

export interface EstadoConexion {
  // Conectado al servicio de PowerSync: lo que se hace aquí sube enseguida
  conectado: boolean
  // Subiendo cambios hechos sin conexión
  subiendo: boolean
  // Cambios guardados en este dispositivo que todavía no llegaron al
  // servidor (Fase 8, Módulo 1): con 0 y "En línea", todo está arriba
  pendientes: number
}

const CADA_MS = 3000

function leer(): Omit<EstadoConexion, 'pendientes'> {
  const status = powerSync.currentStatus
  return { conectado: status.connected, subiendo: status.dataFlowStatus.uploading }
}

// Si el dispositivo está sincronizando con el servidor. Sin conexión la app
// sigue funcionando contra la SQLite local y los cambios suben al volver;
// esto solo lo hace visible (importante en cocina, que no puede pararse).
export function useEstadoConexion(): EstadoConexion {
  const [estado, setEstado] = useState(leer)
  const [pendientes, setPendientes] = useState(0)

  useEffect(
    () =>
      powerSync.registerListener({
        statusChanged: (status) =>
          setEstado({ conectado: status.connected, subiendo: status.dataFlowStatus.uploading }),
      }),
    [],
  )

  // La cola de subida se lee de la base local cada pocos segundos: es una
  // consulta chica y es lo único que dice cuánto falta por subir
  useEffect(() => {
    let cancelado = false
    const leerCola = () =>
      powerSync
        .getUploadQueueStats()
        .then((s) => {
          if (!cancelado) setPendientes(s.count)
        })
        .catch(() => {})
    leerCola()
    const intervalo = setInterval(leerCola, CADA_MS)
    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [])

  return { ...estado, pendientes }
}
