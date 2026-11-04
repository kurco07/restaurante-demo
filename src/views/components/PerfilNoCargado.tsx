import { useState } from 'react'
import { useAuth } from '../../controllers/auth/useAuth'
import { useEstadoConexion } from '../../controllers/useEstadoConexion'
import { powerSync } from '../../lib/powerSyncClient'
import { avisar } from '../../controllers/avisos/avisos'

// Cuando el perfil no termina de cargar (Fase 8, Módulo 2). Antes la app
// quedaba en "Cargando…" para siempre y el arreglo era a mano: F12,
// Application, Clear site data. "Reiniciar datos de este dispositivo"
// hace lo mismo con la copia local de PowerSync: la borra y la vuelve a
// bajar del servidor. La sesión iniciada y los carritos no se tocan.
export function PerfilNoCargado() {
  const { signOut } = useAuth()
  const { conectado, pendientes } = useEstadoConexion()
  const [reiniciando, setReiniciando] = useState(false)

  async function reiniciar() {
    if (
      pendientes > 0 &&
      !window.confirm(
        `Este dispositivo tiene ${pendientes} cambio(s) que todavía no subieron al servidor. Si reinicias se pierden. ¿Reiniciar igual?`,
      )
    ) {
      return
    }
    setReiniciando(true)
    try {
      await powerSync.disconnectAndClear()
      window.location.reload()
    } catch (e) {
      avisar.error(e, 'No se pudieron reiniciar los datos')
      setReiniciando(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-bold text-gray-900">No se pudo cargar tu perfil</p>
      <p className="max-w-sm text-sm text-gray-500">
        {conectado
          ? 'Este dispositivo no logra leer tus datos. Reiniciar los datos de este dispositivo suele resolverlo: se vuelven a bajar del servidor.'
          : 'Sin conexión: este dispositivo todavía no tiene tus datos guardados. Conéctate a internet y espera unos segundos.'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => void reiniciar()}
          disabled={reiniciando || !conectado}
          className="rounded-lg bg-[var(--orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {reiniciando ? 'Reiniciando…' : 'Reiniciar datos de este dispositivo'}
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
