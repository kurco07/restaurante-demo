import { useEffect } from 'react'
import { FUENTES_DISPONIBLES } from './fuentesMarca'

// Aplica la marca del tenant sobre las variables CSS que ya usa toda la
// app (src/index.css define los valores por defecto). Colores, fuente y
// marca de agua — todo opcional: lo que el tenant no haya personalizado
// se queda en el valor por defecto de la plataforma.
const CLAVE_CACHE = 'beta-restaurant-marca-cache'

interface DatosMarca {
  color_primario?: string | null
  color_secundario?: string | null
  color_acento?: string | null
  color_sidebar?: string | null
  fuente?: string | null
  marca_agua_activa?: boolean
  marca_agua_opacidad?: number
  marca_agua_tamano?: number
  logo_url?: string | null
}

// Blanco o casi-negro según qué tan clara sea la barra lateral elegida —
// así el tenant puede poner cualquier color sin arriesgar texto ilegible.
// Fórmula de brillo percibido estándar (ITU-R BT.601), no luminancia
// relativa exacta: de sobra para decidir blanco vs. negro en UI.
function textoLegibleSobre(colorHex: string): string {
  const limpio = colorHex.replace('#', '')
  const normalizado = limpio.length === 3 ? [...limpio].map((c) => c + c).join('') : limpio
  const r = parseInt(normalizado.slice(0, 2), 16)
  const g = parseInt(normalizado.slice(2, 4), 16)
  const b = parseInt(normalizado.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return '#ffffff'
  const brillo = (r * 299 + g * 587 + b * 114) / 1000
  return brillo > 150 ? '#1a1410' : '#ffffff'
}

// Evita inyectar el mismo <link> de Google Fonts dos veces si varias
// pantallas montan el hook (UsuarioProvider, InicioPage, AutopedidoPage).
function asegurarFuenteCargada(nombreFuente: string) {
  const info = FUENTES_DISPONIBLES.find((f) => f.valor === nombreFuente)
  if (!info) return
  const id = `fuente-marca-${info.valor.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${info.googleFontsParam}&display=swap`
  document.head.appendChild(link)
}

function aplicar(colores: DatosMarca | null) {
  const raiz = document.documentElement.style

  if (colores?.color_primario) raiz.setProperty('--orange', colores.color_primario)
  else raiz.removeProperty('--orange')
  if (colores?.color_secundario) raiz.setProperty('--orange-dark', colores.color_secundario)
  else raiz.removeProperty('--orange-dark')
  if (colores?.color_acento) raiz.setProperty('--acento', colores.color_acento)
  else raiz.removeProperty('--acento')

  if (colores?.color_sidebar) {
    raiz.setProperty('--sidebar-bg', colores.color_sidebar)
    raiz.setProperty('--sidebar-text', textoLegibleSobre(colores.color_sidebar))
  } else {
    raiz.removeProperty('--sidebar-bg')
    raiz.removeProperty('--sidebar-text')
  }

  if (colores?.fuente) {
    asegurarFuenteCargada(colores.fuente)
    raiz.setProperty('--font-marca', `'${colores.fuente}'`)
  } else {
    raiz.removeProperty('--font-marca')
  }

  if (colores?.marca_agua_activa && colores.logo_url) {
    raiz.setProperty('--marca-agua-imagen', `url(${colores.logo_url})`)
    raiz.setProperty('--marca-agua-opacidad', String(colores.marca_agua_opacidad ?? 0.06))
    raiz.setProperty('--marca-agua-tamano', `${colores.marca_agua_tamano ?? 680}px`)
  } else {
    raiz.removeProperty('--marca-agua-imagen')
    raiz.removeProperty('--marca-agua-opacidad')
    raiz.removeProperty('--marca-agua-tamano')
  }
}

// Antes de que resuelva el fetch real, aplica lo último conocido (si hay)
// para que no haya parpadeo entre el valor por defecto y el del tenant.
export function aplicarMarcaCacheada() {
  try {
    const guardada = localStorage.getItem(CLAVE_CACHE)
    if (guardada) aplicar(JSON.parse(guardada))
  } catch {
    // sin caché disponible, se queda con los valores por defecto hasta
    // que llegue el valor real
  }
}

export function useAplicarMarca(colores: DatosMarca | null | undefined) {
  useEffect(() => {
    if (colores === undefined) return // todavía cargando: deja lo que haya cacheado
    aplicar(colores)
    try {
      if (colores) localStorage.setItem(CLAVE_CACHE, JSON.stringify(colores))
      else localStorage.removeItem(CLAVE_CACHE)
    } catch {
      // almacenamiento lleno o no disponible — no afecta el theming en sí
    }
  }, [
    colores?.color_primario,
    colores?.color_secundario,
    colores?.color_acento,
    colores?.color_sidebar,
    colores?.fuente,
    colores?.marca_agua_activa,
    colores?.marca_agua_opacidad,
    colores?.marca_agua_tamano,
    colores?.logo_url,
  ])
}
