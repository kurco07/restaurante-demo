import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { usePanelAdmin } from '../../../controllers/administracion/usePanelAdmin'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import {
  AlertasInventario,
  EstadoMesasMini,
  IndicadoresGrid,
  MasVendidos,
  PanelHeader,
  PedidosRecientes,
  VentasSemanaChart,
} from './components/panel'

export default function AdministracionPage() {
  const { usuario, loading, error } = useUsuario()
  const panel = usePanelAdmin()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />
  if (panel.cargando) return <LoadingSpinner message="Cargando el panel…" />
  if (panel.error) return <ErrorMessage message={panel.error} />

  return (
    <AdminLayout usuario={usuario}>
      <PanelHeader
        nombre={usuario.nombre}
        fechaHoy={panel.fechaHoy}
        periodo={panel.periodo}
        onCambiarPeriodo={panel.setPeriodo}
      />

      <IndicadoresGrid
        indicadores={panel.indicadores}
        periodo={panel.periodo}
        productosBajoStock={panel.alertasInventario.length}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <VentasSemanaChart ventas={panel.ventasSemana} ventaMaxima={panel.ventaMaximaSemana} />
          <PedidosRecientes pedidos={panel.pedidosRecientes} />
        </div>
        <div>
          <MasVendidos productos={panel.masVendidos} />
          <AlertasInventario alertas={panel.alertasInventario} />
          <EstadoMesasMini mesas={panel.mesas} conteo={panel.conteoMesas} />
        </div>
      </div>
    </AdminLayout>
  )
}
