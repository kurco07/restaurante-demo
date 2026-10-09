import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './views/components/AuthProvider'
import { UsuarioProvider } from './views/components/UsuarioProvider'
import { ProtectedRoute } from './controllers/auth/ProtectedRoute'
import LoginPage from './views/modules/login/LoginPage'
import RegistroPage from './views/modules/registro/RegistroPage'
import { useAuth } from './controllers/auth/useAuth'
import { useUsuario } from './controllers/usuario/useUsuario'
import { rolesPorModulo } from './lib/rolesPorModulo'
import MesonerosPage from './views/modules/mesoneros/MesonerosPage'
import PedidosPage from './views/modules/pedidos/PedidosPage'
import CocinaPage from './views/modules/cocina/CocinaPage'
import AutopedidoPage from './views/modules/autopedido/AutopedidoPage'
import AdministracionPage from './views/modules/administracion/AdministracionPage'
import MenuAdminPage from './views/modules/administracion/MenuAdminPage'
import ReportesPage from './views/modules/administracion/ReportesPage'
import ProveedoresPage from './views/modules/administracion/ProveedoresPage'
import PersonalPage from './views/modules/administracion/PersonalPage'
import PedidosAdminPage from './views/modules/administracion/PedidosAdminPage'
import MovimientosPage from './views/modules/administracion/MovimientosPage'
import MesasAdminPage from './views/modules/administracion/MesasAdminPage'
import InsumosPage from './views/modules/administracion/InsumosPage'
import LotesPage from './views/modules/administracion/LotesPage'
import ConfiguracionPage from './views/modules/administracion/ConfiguracionPage'
import ComprasPage from './views/modules/administracion/ComprasPage'
import GerenciaPage from './views/modules/gerencia/GerenciaPage'
import SuperAdminPage from './views/modules/super-admin/SuperAdminPage'
import InicioPage from './views/modules/inicio/InicioPage'
import ProximamentePage from './views/modules/proximamente/ProximamentePage'

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
            <Route path="/registro" element={<RegistroPage />} />
            {/* /autopedido queda pública a propósito: es la vista del cliente por QR.
                Sin :mesaId muestra "QR no válido". */}
            <Route path="/autopedido" element={<AutopedidoPage />} />
            <Route path="/autopedido/:mesaId" element={<AutopedidoPage />} />
            {/* /inicio y /proximamente también son públicas: prototipo navegable
                de interfaces (Pedro + Cesar), sin funcionalidad todavía */}
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/proximamente" element={<ProximamentePage />} />
            <Route
              path="/mesoneros"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/mesoneros']}>
                  <MesonerosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mesoneros/pedidos/:mesaId"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/mesoneros']}>
                  <PedidosPage />
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
              path="/administracion/menu"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <MenuAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/reportes"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <ReportesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/proveedores"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <ProveedoresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/personal"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <PersonalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/pedidos"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <PedidosAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/movimientos"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <MovimientosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/insumos"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <InsumosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/insumos/:insumoId/lotes"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <LotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/compras"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <ComprasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/configuracion"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <ConfiguracionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracion/mesas"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <MesasAdminPage />
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
