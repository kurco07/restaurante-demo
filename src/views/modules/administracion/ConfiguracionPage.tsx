import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useConfiguracion } from '../../../controllers/administracion/useConfiguracion'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { EncabezadoAdmin } from './components/comunes'
import { DatosRestauranteSeccion } from './components/configuracion/DatosRestauranteSeccion'
import { FacturacionSeccion } from './components/configuracion/FacturacionSeccion'
import { ColoresMarcaSeccion } from './components/configuracion/ColoresMarcaSeccion'
import { NotificacionesSeccion } from './components/configuracion/NotificacionesSeccion'

export default function ConfiguracionPage() {
  const { usuario, loading, error } = useUsuario()
  const config = useConfiguracion()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <AdminLayout usuario={usuario}>
      <div className="max-w-[832px]">
        <EncabezadoAdmin ruta="Administración · Configuración" titulo="Configuración" />

        <DatosRestauranteSeccion datos={config.datos} />
        <FacturacionSeccion
          facturacion={config.facturacion}
          metodosPago={config.metodosPago}
          pagosActivos={config.pagosActivos}
          onAlternarPago={config.alternarPago}
        />
        <ColoresMarcaSeccion tenantId={usuario.tenant_id} />
        <NotificacionesSeccion
          notificaciones={config.notificaciones}
          activas={config.alertasActivas}
          onAlternar={config.alternarAlerta}
        />

        <button
          type="button"
          className="w-full max-w-[220px] rounded-xl bg-[var(--orange)] p-3.5 text-center text-sm font-bold text-white"
        >
          Guardar cambios
        </button>
      </div>
    </AdminLayout>
  )
}
