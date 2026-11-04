import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface Props {
  // Dónde está puesta, para el registro en consola ("mesonero", "cocina"…)
  nombre: string
  children: ReactNode
}

interface State {
  error: Error | null
}

// Red contra la pantalla en blanco (Fase 8, Módulo 2). Si un componente
// falla al dibujarse, en vez de quedar toda la app en blanco se muestra
// este aviso con dos salidas. Hay una global (main.tsx) y una por módulo
// (App.tsx): si falla cocina, el resto de la app ni se entera.
//
// Recargar no pierde nada: lo hecho sin internet está en la base local de
// PowerSync, y los carritos (mesonero y autopedido) en el almacenamiento
// del navegador. Con la app instalada, recargar funciona también offline.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary ${this.props.nombre}]`, error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-bold text-gray-900">Algo falló en esta pantalla</p>
        <p className="max-w-sm text-sm text-gray-500">
          No se perdió nada de lo guardado. Recarga para seguir trabajando; si vuelve a pasar, avísale al
          administrador.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[var(--orange)] px-4 py-2 text-sm font-bold text-white"
          >
            Recargar
          </button>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700"
          >
            Volver a intentar
          </button>
        </div>
      </div>
    )
  }
}

// La red de un módulo: se reinicia sola al cambiar de pantalla, así que
// si falla una pantalla basta con ir a otra desde el menú
export function RedDeModulo({ nombre, children }: Props) {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary key={pathname} nombre={nombre}>
      {children}
    </ErrorBoundary>
  )
}
