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
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />
  if (config.loading) return <LoadingSpinner message="Cargando configuración…" />
  if (config.error || !config.sede) return <ErrorMessage message={config.error ?? 'No se pudo cargar la sede.'} />

  return (
    <AdminLayout usuario={usuario}>
      <div className="max-w-[832px]">
        <EncabezadoAdmin ruta="Administración · Configuración" titulo="Configuración" />

        {/* Cada sección guarda la suya (como Colores de marca) — no hay
            un botón único al fondo que no sabría qué de todo esto guardar. */}
        <DatosRestauranteSeccion sede={config.sede} onGuardar={config.guardar} />
        <FacturacionSeccion sede={config.sede} onGuardar={config.guardar} />
        <ColoresMarcaSeccion tenantId={usuario.tenant_id} />
        <NotificacionesSeccion sede={config.sede} onGuardar={config.guardar} />
      </div>
    </AdminLayout>
  )
}
