import { useSyncExternalStore } from 'react'
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

// Un solo estado compartido por toda la app (Fase 8, Módulo 3). Antes cada
// pantalla que lo usaba tenía su propio temporizador consultando la cola
// cada 3 s (en mesonero eran 3 a la vez); ahora hay uno solo, que corre
// mientras alguien lo esté mirando.
let estado: EstadoConexion = {
  conectado: powerSync.currentStatus.connected,
  subiendo: powerSync.currentStatus.dataFlowStatus.uploading,
  pendientes: 0,
}
const oyentes = new Set<() => void>()
let detener: (() => void) | null = null

function actualizar(cambios: Partial<EstadoConexion>) {
  const nuevo = { ...estado, ...cambios }
  if (
    nuevo.conectado === estado.conectado &&
    nuevo.subiendo === estado.subiendo &&
    nuevo.pendientes === estado.pendientes
  ) {
    return
  }
  estado = nuevo
  for (const o of oyentes) o()
}

function empezar() {
  const quitarOyente = powerSync.registerListener({
    statusChanged: (status) =>
      actualizar({ conectado: status.connected, subiendo: status.dataFlowStatus.uploading }),
  })
  // La cola de subida se lee de la base local: es una consulta chica y es
  // lo único que dice cuánto falta por subir
  const leerCola = () =>
    powerSync
      .getUploadQueueStats()
      .then((s) => actualizar({ pendientes: s.count }))
      .catch(() => {})
  leerCola()
  const intervalo = setInterval(leerCola, CADA_MS)
  return () => {
    quitarOyente()
    clearInterval(intervalo)
  }
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  if (!detener) detener = empezar()
  return () => {
    oyentes.delete(oyente)
    if (oyentes.size === 0 && detener) {
      detener()
      detener = null
    }
  }
}

// Si el dispositivo está sincronizando con el servidor. Sin conexión la app
// sigue funcionando contra la SQLite local y los cambios suben al volver;
// esto solo lo hace visible (importante en cocina, que no puede pararse).
export function useEstadoConexion(): EstadoConexion {
  return useSyncExternalStore(suscribir, () => estado)
}
