import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUsuario } from '../hooks/useUsuario'
import type { Rol } from '../types/usuario'

interface ProtectedRouteProps {
  allowedRoles: Rol[]
  children: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { usuario, loading: usuarioLoading } = useUsuario()

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

  return <>{children}</>
}
