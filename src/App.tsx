import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './views/components/AuthProvider'
import { UsuarioProvider } from './views/components/UsuarioProvider'
import { ProtectedRoute } from './controllers/auth/ProtectedRoute'
import LoginPage from './views/modules/login/LoginPage'
import RegistroPage from './views/modules/registro/RegistroPage'
import { rolesPorModulo } from './lib/rolesPorModulo'
import MesoneroLayout from './views/modules/mesoneros/MesoneroLayout'
import MesonerosPage from './views/modules/mesoneros/MesonerosPage'
import MisPedidosPage from './views/modules/mesoneros/MisPedidosPage'
import ReporteDelDiaPage from './views/modules/mesoneros/ReporteDelDiaPage'
import PedidosPage from './views/modules/pedidos/PedidosPage'
import CocinaLayout from './views/modules/cocina/CocinaLayout'
import CocinaPage from './views/modules/cocina/CocinaPage'
import EntregadosPage from './views/modules/cocina/EntregadosPage'
import RecetasCocinaPage from './views/modules/cocina/RecetasCocinaPage'
import SugeridosPage from './views/modules/cocina/SugeridosPage'
import AutopedidoPage from './views/modules/autopedido/AutopedidoPage'
import AdministracionPage from './views/modules/administracion/AdministracionPage'
import MenuAdminPage from './views/modules/administracion/MenuAdminPage'
import ProveedoresPage from './views/modules/administracion/ProveedoresPage'
import PersonalPage from './views/modules/administracion/PersonalPage'
import PedidosAdminPage from './views/modules/administracion/PedidosAdminPage'
import MovimientosPage from './views/modules/administracion/MovimientosPage'
import ConteoFisicoPage from './views/modules/administracion/ConteoFisicoPage'
import MesasAdminPage from './views/modules/administracion/MesasAdminPage'
import InsumosPage from './views/modules/administracion/InsumosPage'
import LotesPage from './views/modules/administracion/LotesPage'
import ConfiguracionPage from './views/modules/administracion/ConfiguracionPage'
import ComprasPage from './views/modules/administracion/ComprasPage'
import SugerenciasCompraPage from './views/modules/administracion/SugerenciasCompraPage'
import GerenciaLayout from './views/modules/gerencia/GerenciaLayout'
import VentasPage from './views/modules/gerencia/VentasPage'
import RentabilidadPage from './views/modules/gerencia/RentabilidadPage'
import InventarioGerenciaPage from './views/modules/gerencia/InventarioGerenciaPage'
import ReportesDiariosPage from './views/modules/gerencia/ReportesDiariosPage'
import SedesPage from './views/modules/gerencia/SedesPage'
import AlertasPage from './views/modules/gerencia/AlertasPage'
import SugerenciasIAPage from './views/modules/gerencia/SugerenciasIAPage'
import SuperAdminPage from './views/modules/super-admin/SuperAdminPage'
import InicioPage from './views/modules/inicio/InicioPage'
import ProximamentePage from './views/modules/proximamente/ProximamentePage'
import VistaARPage from './views/modules/ar/VistaARPage'

export default function App() {
  return (
    <AuthProvider>
      <UsuarioProvider>
        <BrowserRouter>
          <Routes>
            {/* Sin página intermedia de prueba: entrar al dominio va directo a
                login (personal) — /inicio es la home pública de clientes. */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroPage />} />
            {/* /autopedido queda pública a propósito: es la vista del cliente por QR.
                Sin :mesaId muestra "QR no válido". */}
            <Route path="/autopedido" element={<AutopedidoPage />} />
            <Route path="/autopedido/:mesaId" element={<AutopedidoPage />} />
            {/* Pestaña dedicada para "Ver en RA" (se abre con window.open),
                aislada del resto de la app — ver VistaARPage.tsx */}
            <Route path="/ar" element={<VistaARPage />} />
            {/* /inicio y /proximamente también son públicas: prototipo navegable
                de interfaces (Pedro + Cesar), sin funcionalidad todavía */}
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/proximamente" element={<ProximamentePage />} />
            {/* Módulo del mesonero: barra superior y una sección por ruta.
                /menu sin mesa = anotar primero y elegir la mesa al enviar. */}
            <Route
              path="/mesoneros"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/mesoneros']}>
                  <MesoneroLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MesonerosPage />} />
              <Route path="menu" element={<PedidosPage />} />
              <Route path="menu/:mesaId" element={<PedidosPage />} />
              <Route path="pedidos" element={<MisPedidosPage />} />
              <Route path="reporte" element={<ReporteDelDiaPage />} />
            </Route>
            {/* Cocina: barra superior con el tablero, sugeridos, entregados y recetas */}
            <Route
              path="/cocina"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/cocina']}>
                  <CocinaLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CocinaPage />} />
              <Route path="sugeridos" element={<SugeridosPage />} />
              <Route path="entregados" element={<EntregadosPage />} />
              <Route path="recetas" element={<RecetasCocinaPage />} />
            </Route>
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
              path="/administracion/conteo-fisico"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <ConteoFisicoPage />
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
              path="/administracion/sugerencias-compra"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                  <SugerenciasCompraPage />
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
            {/* Panel de gerencia: un layout con barra lateral y una sección por ruta */}
            <Route
              path="/gerencia"
              element={
                <ProtectedRoute allowedRoles={rolesPorModulo['/gerencia']}>
                  <GerenciaLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<VentasPage />} />
              <Route path="rentabilidad" element={<RentabilidadPage />} />
              <Route path="inventario" element={<InventarioGerenciaPage />} />
              <Route path="reportes" element={<ReportesDiariosPage />} />
              <Route path="sedes" element={<SedesPage />} />
              <Route path="alertas" element={<AlertasPage />} />
              <Route path="sugerencias" element={<SugerenciasIAPage />} />
            </Route>
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
