import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import { UsuarioProvider } from './components/UsuarioProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './components/LoginPage'
import { useAuth } from './hooks/useAuth'
import { useUsuario } from './hooks/useUsuario'
import { rolesPorModulo } from './lib/rolesPorModulo'
import MesonerosPage from './modules/mesoneros/MesonerosPage'
import CocinaPage from './modules/cocina/CocinaPage'
import AutopedidoPage from './modules/autopedido/AutopedidoPage'
import AdministracionPage from './modules/administracion/AdministracionPage'
import GerenciaPage from './modules/gerencia/GerenciaPage'
import SuperAdminPage from './modules/super-admin/SuperAdminPage'

const modulos = [
  { path: '/mesoneros', label: 'Mesoneros' },
  { path: '/cocina', label: 'Cocina' },
  { path: '/autopedido', label: 'Autopedido' },
  { path: '/administracion', label: 'Administración' },
  { path: '/gerencia', label: 'Gerencia' },
  { path: '/super-admin', label: 'Super Admin' },
]

function SesionBar() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { usuario, loading: usuarioLoading, error: usuarioError } = useUsuario()

  if (authLoading) {
    return <p className="text-sm text-gray-500">Cargando sesión…</p>
  }

  if (!user) {
    return (
      <Link to="/login" className="text-blue-600 underline hover:text-blue-800">
        Iniciar sesión
      </Link>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-gray-600">Sesión iniciada como {user.email}</span>
        <button onClick={() => signOut()} className="text-red-600 underline hover:text-red-800">
          Cerrar sesión
        </button>
      </div>
      {usuarioLoading && <span className="text-gray-400">Cargando perfil…</span>}
      {usuarioError && <span className="text-red-600">Error de perfil: {usuarioError}</span>}
      {usuario && (
        <span className="text-gray-500">
          rol: {usuario.rol} · tenant: {usuario.tenant_id}
          {usuario.sede_id ? ` · sede: ${usuario.sede_id}` : ''}
        </span>
      )}
    </div>
  )
}

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold">Plataforma de Restaurantes</h1>
      <SesionBar />
      <nav className="flex flex-col items-center gap-2">
        {modulos.map((modulo) => (
          <Link
            key={modulo.path}
            to={modulo.path}
            className="text-blue-600 underline hover:text-blue-800"
          >
            {modulo.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <UsuarioProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* /autopedido queda pública a propósito: es la vista del cliente por QR */}
            <Route path="/autopedido" element={<AutopedidoPage />} />
            <Route
              path="/mesoneros"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/mesoneros']}>
                  <MesonerosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cocina"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/cocina']}>
                  <CocinaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <AdministracionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gerencia"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/gerencia']}>
                  <GerenciaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/super-admin']}>
                  <SuperAdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </UsuarioProvider>
    </AuthProvider>
  )
}
