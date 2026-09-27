import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { filtrosCompras, useCompras } from '../../../controllers/administracion/useCompras'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { InventarioTabs } from './components/InventarioTabs'
import { BotonNuevo, EncabezadoAdmin, FiltroPills, TarjetasResumen } from './components/comunes'
import { formatearMoneda } from './components/constants'
import { TablaOrdenes } from './components/compras/TablaOrdenes'
import { DetalleOrdenPanel } from './components/compras/DetalleOrdenPanel'

export default function ComprasPage() {
  const { usuario, loading, error } = useUsuario()
  const compras = useCompras()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoAdmin ruta="Administración · Inventario · Compras" titulo="Órdenes de compra">
        <BotonNuevo>+ Nueva orden</BotonNuevo>
      </EncabezadoAdmin>

      <InventarioTabs />

      <TarjetasResumen
        items={[
          { valor: compras.resumen.ordenes, etiqueta: 'Órdenes este mes' },
          { valor: formatearMoneda(compras.resumen.comprometido), etiqueta: 'Comprometido este mes' },
          { valor: compras.resumen.pendientes, etiqueta: 'Pendientes de aprobación', alerta: true },
        ]}
      />

      <FiltroPills opciones={filtrosCompras} activo={compras.filtro} onCambiar={compras.setFiltro} />

      <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
        <TablaOrdenes
          ordenes={compras.ordenesFiltradas}
          totalMes={compras.resumen.ordenes}
          seleccionadaId={compras.seleccionada?.id}
          onSeleccionar={compras.seleccionar}
        />
        {compras.seleccionada && <DetalleOrdenPanel orden={compras.seleccionada} />}
      </div>
    </AdminLayout>
  )
}
