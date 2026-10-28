import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useUsuario } from '../usuario/useUsuario'
import type { Rol } from '../../models/types/usuario'
import type { ModuloOpcional } from '../../models/services/modulosService'

interface ProtectedRouteProps {
  allowedRoles: Rol[]
  // Módulo opcional de esta ruta (Fase 7, Módulo 5): si el tenant lo tiene
  // apagado, se avisa en vez de mostrar la pantalla. Varios módulos
  // listados = basta con que uno esté prendido (ej. /gerencia/sugerencias
  // junta platos a preparar + recomendados).
  modulo?: ModuloOpcional | ModuloOpcional[]
  children: ReactNode
}

export function ProtectedRoute({ allowedRoles, modulo, children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { usuario, loading: usuarioLoading, modulosActivos } = useUsuario()

  if (authLoading || (user && usuarioLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Cargando sesión…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!usuario || !allowedRoles.includes(usuario.rol)) {
    return <Navigate to="/" replace />
  }

  const modulosRequeridos = modulo ? (Array.isArray(modulo) ? modulo : [modulo]) : null
  // modulosActivos null = todavía no se sabe (recién logueado, sin red) —
  // no bloquear por accidente, se deja entrar.
  if (modulosRequeridos && modulosActivos && !modulosRequeridos.some((m) => modulosActivos.has(m))) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-lg font-bold text-gray-900">Esta función no está activa para tu restaurante</p>
        <p className="max-w-sm text-sm text-gray-500">Si crees que debería estarlo, pídele al equipo que la active.</p>
      </div>
    )
  }

  return <>{children}</>
}
