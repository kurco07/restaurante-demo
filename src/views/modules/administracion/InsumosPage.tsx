import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useInsumosAdmin } from '../../../controllers/administracion/useInsumosAdmin'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import {
  BotonNuevo,
  BuscadorAdmin,
  EncabezadoAdmin,
  FiltroPills,
  TarjetasResumen,
} from './components/comunes'
import { TablaInsumos } from './components/inventario/TablaInsumos'
import { EditorInsumo } from './components/inventario/EditorInsumo'
import { InventarioTabs } from './components/InventarioTabs'

export default function InsumosPage() {
  const { usuario, loading, error } = useUsuario()
  const inv = useInsumosAdmin()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoAdmin ruta="Administración · Inventario" titulo="Gestión de insumos">
        <BuscadorAdmin valor={inv.busqueda} onCambiar={inv.setBusqueda} placeholder="Buscar insumo..." />
        <BotonNuevo>+ Nuevo insumo</BotonNuevo>
      </EncabezadoAdmin>

      <InventarioTabs />

      <TarjetasResumen
        items={[
          { valor: inv.resumen.registrados, etiqueta: 'Insumos registrados' },
          { valor: inv.resumen.categorias, etiqueta: 'Categorías' },
          { valor: inv.resumen.bajoStock, etiqueta: 'Insumos con stock bajo', alerta: true },
        ]}
      />

      <FiltroPills opciones={inv.categorias} activo={inv.categoria} onCambiar={inv.setCategoria} />

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <TablaInsumos
          insumos={inv.insumosFiltrados}
          total={inv.resumen.registrados}
          seleccionadoId={inv.seleccionado?.id}
          onSeleccionar={inv.seleccionar}
        />
        {inv.seleccionado && <EditorInsumo insumo={inv.seleccionado} />}
      </div>
    </AdminLayout>
  )
}
