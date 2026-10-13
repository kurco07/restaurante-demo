import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useInsumosAdmin } from '../../../controllers/administracion/useInsumosAdmin'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { BotonNuevo, BuscadorAdmin, EncabezadoAdmin, ModalAdmin, TarjetasResumen } from './components/comunes'
import { TablaInsumos } from './components/inventario/TablaInsumos'
import { EditorInsumo } from './components/inventario/EditorInsumo'
import { InventarioTabs } from './components/InventarioTabs'

export default function InsumosPage() {
  const { usuario, loading, error } = useUsuario()
  const inv = useInsumosAdmin()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  const modalAbierto = inv.creando || inv.seleccionado !== null

  function cerrarModal() {
    inv.setCreando(false)
    inv.seleccionar(null)
  }

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoAdmin ruta="Administración · Inventario" titulo="Gestión de insumos">
        <BuscadorAdmin valor={inv.busqueda} onCambiar={inv.setBusqueda} placeholder="Buscar insumo..." />
        <BotonNuevo
          onClick={() => {
            inv.seleccionar(null)
            inv.setCreando(true)
          }}
        >
          + Nuevo insumo
        </BotonNuevo>
      </EncabezadoAdmin>

      <InventarioTabs />

      {inv.error && <ErrorMessage message={inv.error} />}

      <TarjetasResumen
        items={[
          { valor: inv.resumen.registrados, etiqueta: 'Insumos registrados' },
          { valor: inv.resumen.bajoStock, etiqueta: 'Insumos con stock bajo', alerta: true },
        ]}
      />

      {inv.loading ? (
        <LoadingSpinner message="Cargando insumos…" />
      ) : (
        <TablaInsumos
          insumos={inv.insumosFiltrados}
          inventarioPorInsumo={inv.inventarioPorInsumo}
          total={inv.resumen.registrados}
          onEditar={(id) => {
            inv.setCreando(false)
            inv.seleccionar(id)
          }}
        />
      )}

      {modalAbierto && (
        <ModalAdmin titulo={inv.creando ? 'Nuevo insumo' : 'Editor de insumo'} onCerrar={cerrarModal}>
          <EditorInsumo
            insumo={inv.seleccionado}
            inventario={inv.seleccionado ? inv.inventarioPorInsumo.get(inv.seleccionado.id) : undefined}
            creando={inv.creando}
            guardando={inv.guardando}
            onCrear={inv.crear}
            onGuardar={inv.guardar}
            onGuardarStockMinimo={inv.guardarStockMinimo}
            onEliminar={inv.eliminar}
            onCancelar={cerrarModal}
          />
        </ModalAdmin>
      )}
    </AdminLayout>
  )
}
