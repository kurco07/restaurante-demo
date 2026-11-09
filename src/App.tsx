import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './views/components/AuthProvider'
import { UsuarioProvider } from './views/components/UsuarioProvider'
import { RedDeModulo } from './views/components/ErrorBoundary'
import { Avisos } from './views/components/ui/Avisos'
import { AvisoVersionNueva } from './views/components/AvisoVersionNueva'
import { AvisoSinConexion } from './views/components/AvisoSinConexion'
import { LoadingSpinner } from './views/components/ui/LoadingSpinner'
import { ProtectedRoute } from './controllers/auth/ProtectedRoute'
import { rolesPorModulo } from './lib/rolesPorModulo'
import LoginPage from './views/modules/login/LoginPage'

// Cada pantalla se carga aparte (Fase 8, Módulo 3): una tablet de cocina no
// baja ni interpreta el código de gerencia o administración, lo que pesa en
// equipos de gama baja. Sin internet sigue funcionando igual: el service
// worker guarda todas las partes al instalar la app. Solo el login va en el
// paquete principal, porque es lo primero que se ve.
const RegistroPage = lazy(() => import('./views/modules/registro/RegistroPage'))
const MesoneroLayout = lazy(() => import('./views/modules/mesoneros/MesoneroLayout'))
const MesonerosPage = lazy(() => import('./views/modules/mesoneros/MesonerosPage'))
const MisPedidosPage = lazy(() => import('./views/modules/mesoneros/MisPedidosPage'))
const ReporteDelDiaPage = lazy(() => import('./views/modules/mesoneros/ReporteDelDiaPage'))
const SugeridosMesoneroPage = lazy(() => import('./views/modules/mesoneros/SugeridosPage'))
const PedidosPage = lazy(() => import('./views/modules/pedidos/PedidosPage'))
const CocinaLayout = lazy(() => import('./views/modules/cocina/CocinaLayout'))
const CocinaPage = lazy(() => import('./views/modules/cocina/CocinaPage'))
const EntregadosPage = lazy(() => import('./views/modules/cocina/EntregadosPage'))
const RecetasCocinaPage = lazy(() => import('./views/modules/cocina/RecetasCocinaPage'))
const SugeridosPage = lazy(() => import('./views/modules/cocina/SugeridosPage'))
const AutopedidoPage = lazy(() => import('./views/modules/autopedido/AutopedidoPage'))
const AdministracionPage = lazy(() => import('./views/modules/administracion/AdministracionPage'))
const MenuAdminPage = lazy(() => import('./views/modules/administracion/MenuAdminPage'))
const ProveedoresPage = lazy(() => import('./views/modules/administracion/ProveedoresPage'))
const PersonalPage = lazy(() => import('./views/modules/administracion/PersonalPage'))
const PedidosAdminPage = lazy(() => import('./views/modules/administracion/PedidosAdminPage'))
const MovimientosPage = lazy(() => import('./views/modules/administracion/MovimientosPage'))
const ConteoFisicoPage = lazy(() => import('./views/modules/administracion/ConteoFisicoPage'))
const MesasAdminPage = lazy(() => import('./views/modules/administracion/MesasAdminPage'))
const InsumosPage = lazy(() => import('./views/modules/administracion/InsumosPage'))
const LotesPage = lazy(() => import('./views/modules/administracion/LotesPage'))
const ConfiguracionPage = lazy(() => import('./views/modules/administracion/ConfiguracionPage'))
const ComprasPage = lazy(() => import('./views/modules/administracion/ComprasPage'))
const SugerenciasCompraPage = lazy(() => import('./views/modules/administracion/SugerenciasCompraPage'))
const GerenciaLayout = lazy(() => import('./views/modules/gerencia/GerenciaLayout'))
const VentasPage = lazy(() => import('./views/modules/gerencia/VentasPage'))
const RentabilidadPage = lazy(() => import('./views/modules/gerencia/RentabilidadPage'))
const InventarioGerenciaPage = lazy(() => import('./views/modules/gerencia/InventarioGerenciaPage'))
const ReportesDiariosPage = lazy(() => import('./views/modules/gerencia/ReportesDiariosPage'))
const SedesPage = lazy(() => import('./views/modules/gerencia/SedesPage'))
const AlertasPage = lazy(() => import('./views/modules/gerencia/AlertasPage'))
const SugerenciasIAPage = lazy(() => import('./views/modules/gerencia/SugerenciasIAPage'))
const SuperAdminPage = lazy(() => import('./views/modules/super-admin/SuperAdminPage'))
const InicioPage = lazy(() => import('./views/modules/inicio/InicioPage'))
const ProximamentePage = lazy(() => import('./views/modules/proximamente/ProximamentePage'))
const VistaARPage = lazy(() => import('./views/modules/ar/VistaARPage'))
const NoEncontradaPage = lazy(() => import('./views/modules/no-encontrada/NoEncontradaPage'))

export default function App() {
  return (
    <AuthProvider>
      <UsuarioProvider>
        <BrowserRouter>
          {/* Franjas de arriba: versión nueva y "sin conexión" en gestión */}
          <div className="sticky top-0 z-[1001]">
            <AvisoVersionNueva />
            <AvisoSinConexion />
          </div>
          <Avisos />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Sin página intermedia de prueba: entrar al dominio va directo a
                  login (personal) — /inicio es la home pública de clientes. */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegistroPage />} />
              {/* /autopedido queda pública a propósito: es la vista del cliente por QR.
                  Sin :mesaId muestra "QR no válido". */}
              <Route
                path="/autopedido"
                element={
                  <RedDeModulo nombre="autopedido">
                    <AutopedidoPage />
                  </RedDeModulo>
                }
              />
              <Route
                path="/autopedido/:mesaId"
                element={
                  <RedDeModulo nombre="autopedido">
                    <AutopedidoPage />
                  </RedDeModulo>
                }
              />
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
                <Route
                  path="sugeridos"
                  element={
                    <ProtectedRoute allowedRoles={rolesPorModulo['/mesoneros']} modulo="ia_recomendados">
                      <SugeridosMesoneroPage />
                    </ProtectedRoute>
                  }
                />
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
                <Route
                  path="sugeridos"
                  element={
                    <ProtectedRoute allowedRoles={rolesPorModulo['/cocina']} modulo="ia_sugerencias_platos">
                      <SugeridosPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="entregados" element={<EntregadosPage />} />
                <Route path="recetas" element={<RecetasCocinaPage />} />
              </Route>
              <Route
                path="/administracion"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <AdministracionPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/menu"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <MenuAdminPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/proveedores"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <ProveedoresPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/personal"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <PersonalPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/pedidos"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <PedidosAdminPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/movimientos"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <MovimientosPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/insumos"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <InsumosPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/conteo-fisico"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <ConteoFisicoPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/insumos/:insumoId/lotes"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <LotesPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/compras"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <ComprasPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/sugerencias-compra"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']} modulo="ia_sugerencias_compra">
                    <RedDeModulo nombre="administración">
                      <SugerenciasCompraPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/configuracion"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <ConfiguracionPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracion/mesas"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/administracion']}>
                    <RedDeModulo nombre="administración">
                      <MesasAdminPage />
                    </RedDeModulo>
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
                <Route
                  path="sedes"
                  element={
                    <ProtectedRoute allowedRoles={rolesPorModulo['/gerencia']} modulo="multi_sede">
                      <SedesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="alertas"
                  element={
                    <ProtectedRoute allowedRoles={rolesPorModulo['/gerencia']} modulo="alertas_gerencia">
                      <AlertasPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="sugerencias"
                  element={
                    <ProtectedRoute
                      allowedRoles={rolesPorModulo['/gerencia']}
                      modulo={['ia_sugerencias_platos', 'ia_recomendados']}
                    >
                      <SugerenciasIAPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute allowedRoles={rolesPorModulo['/super-admin']}>
                    <RedDeModulo nombre="super-admin">
                      <SuperAdminPage />
                    </RedDeModulo>
                  </ProtectedRoute>
                }
              />
              {/* Cualquier otra dirección: "Esta página no existe" en vez de en blanco */}
              <Route path="*" element={<NoEncontradaPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UsuarioProvider>
    </AuthProvider>
  )
}
