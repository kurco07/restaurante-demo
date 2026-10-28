import { useEffect } from 'react'

// Aplica el color de marca del tenant sobre las variables CSS que ya usa
// toda la app (src/index.css define los valores por defecto). Solo se
// personalizan --orange/--orange-dark — el resto de la paleta (fondos,
// bordes, tinta) es de la plataforma, no de cada restaurante.
const CLAVE_CACHE = 'beta-restaurant-marca-cache'

interface ColorMarca {
  color_primario?: string | null
  color_secundario?: string | null
}

function aplicar(colores: ColorMarca | null) {
  const raiz = document.documentElement.style
  if (colores?.color_primario) raiz.setProperty('--orange', colores.color_primario)
  else raiz.removeProperty('--orange')
  if (colores?.color_secundario) raiz.setProperty('--orange-dark', colores.color_secundario)
  else raiz.removeProperty('--orange-dark')
}

// Antes de que resuelva el fetch real, aplica lo último conocido (si hay)
// para que no haya parpadeo entre el color por defecto y el del tenant.
export function aplicarMarcaCacheada() {
  try {
    const guardada = localStorage.getItem(CLAVE_CACHE)
    if (guardada) aplicar(JSON.parse(guardada))
  } catch {
    // sin caché disponible, se queda con el color por defecto hasta que
    // llegue el valor real
  }
}

export function useAplicarMarca(colores: ColorMarca | null | undefined) {
  useEffect(() => {
    if (colores === undefined) return // todavía cargando: deja lo que haya cacheado
    aplicar(colores)
    try {
      if (colores) localStorage.setItem(CLAVE_CACHE, JSON.stringify(colores))
      else localStorage.removeItem(CLAVE_CACHE)
    } catch {
      // almacenamiento lleno o no disponible — no afecta el theming en sí
    }
  }, [colores?.color_primario, colores?.color_secundario])
}
