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
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoAdmin ruta="Administración · Inventario · Compras" titulo="Órdenes de compra">
        <BotonNuevo
          onClick={() => {
            compras.seleccionar(null)
            compras.setCreando(true)
          }}
        >
          + Nueva orden
        </BotonNuevo>
      </EncabezadoAdmin>

      <InventarioTabs />

      {compras.error && <ErrorMessage message={compras.error} />}

      <TarjetasResumen
        items={[
          { valor: compras.resumen.ordenes, etiqueta: 'Órdenes este mes' },
          { valor: formatearMoneda(compras.resumen.comprometido), etiqueta: 'Comprometido este mes' },
          { valor: compras.resumen.borradores, etiqueta: 'Pendientes de aprobación', alerta: true },
        ]}
      />

      <FiltroPills opciones={filtrosCompras} activo={compras.filtro} onCambiar={compras.setFiltro} />

      {compras.loading ? (
        <LoadingSpinner message="Cargando órdenes de compra…" />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
          <TablaOrdenes
            ordenes={compras.ordenesFiltradas}
            totalMes={compras.resumen.ordenes}
            seleccionadaId={compras.seleccionada?.id}
            onSeleccionar={(id) => {
              compras.setCreando(false)
              compras.seleccionar(id)
            }}
          />
          <DetalleOrdenPanel
            key={compras.seleccionada?.id ?? (compras.creando ? 'nueva' : 'vacio')}
            orden={compras.seleccionada}
            creando={compras.creando}
            guardando={compras.guardando}
            proveedores={compras.proveedores}
            insumos={compras.insumos}
            onCrear={compras.crear}
            onGuardarItems={compras.guardarItems}
            onAprobar={compras.aprobar}
            onDescartar={compras.descartar}
            onRecibir={compras.recibir}
            onCancelar={() => compras.setCreando(false)}
          />
        </div>
      )}
    </AdminLayout>
  )
}
