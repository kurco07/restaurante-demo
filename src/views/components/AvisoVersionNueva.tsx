import { useRegisterSW } from 'virtual:pwa-register/react'

// Cada cuánto se pregunta si hay versión nueva publicada. Una tablet de
// cocina puede pasar días con la app abierta sin recargar.
const REVISAR_CADA_MS = 30 * 60 * 1000

// "Hay una versión nueva" (Fase 8, Módulo 2). La versión nueva ya está
// descargada y esperando; tocar el botón la activa y recarga. No se
// recarga sola para no cortarle la pantalla a nadie en pleno servicio.
// Recargar no pierde nada (base local de PowerSync y carritos guardados).
export function AvisoVersionNueva() {
  const {
    needRefresh: [hayVersionNueva, setHayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return
      setInterval(() => {
        // Sin internet simplemente falla: se vuelve a intentar en la próxima
        if (navigator.onLine) registro.update().catch(() => {})
      }, REVISAR_CADA_MS)
    },
  })

  if (!hayVersionNueva) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[1001] flex items-center justify-center gap-3 bg-[var(--ink)] px-4 py-2 text-sm text-white shadow-lg">
      <span>Hay una versión nueva de la app.</span>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="rounded-lg bg-[var(--orange)] px-3 py-1 font-bold"
      >
        Actualizar
      </button>
      <button
        type="button"
        onClick={() => setHayVersionNueva(false)}
        aria-label="Más tarde"
        className="px-1 font-bold opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}
