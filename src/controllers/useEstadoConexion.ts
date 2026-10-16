import { useEffect, useState } from 'react'
import { powerSync } from '../lib/powerSyncClient'

export interface EstadoConexion {
  // Conectado al servicio de PowerSync: lo que se hace aquí sube enseguida
  conectado: boolean
  // Subiendo cambios hechos sin conexión
  subiendo: boolean
}

function leer(): EstadoConexion {
  const status = powerSync.currentStatus
  return { conectado: status.connected, subiendo: status.dataFlowStatus.uploading }
}

// Si el dispositivo está sincronizando con el servidor. Sin conexión la app
// sigue funcionando contra la SQLite local y los cambios suben al volver;
// esto solo lo hace visible (importante en cocina, que no puede pararse).
export function useEstadoConexion(): EstadoConexion {
  const [estado, setEstado] = useState<EstadoConexion>(leer)

  useEffect(
    () =>
      powerSync.registerListener({
        statusChanged: (status) =>
          setEstado({ conectado: status.connected, subiendo: status.dataFlowStatus.uploading }),
      }),
    [],
  )

  return estado
}
