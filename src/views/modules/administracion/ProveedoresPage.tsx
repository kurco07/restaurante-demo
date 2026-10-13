import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useProveedores } from '../../../controllers/administracion/useProveedores'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { InventarioTabs } from './components/InventarioTabs'
import { BotonNuevo, BuscadorAdmin, EncabezadoAdmin, TarjetasResumen } from './components/comunes'
import { EditorProveedor } from './components/proveedores/EditorProveedor'

export default function ProveedoresPage() {
  const { usuario, loading, error } = useUsuario()
  const p = useProveedores()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoAdmin ruta="Administración · Inventario" titulo="Proveedores">
        <BuscadorAdmin valor={p.busqueda} onCambiar={p.setBusqueda} placeholder="Buscar proveedor..." />
        <BotonNuevo
          onClick={() => {
            p.seleccionar(null)
            p.setCreando(true)
          }}
        >
          + Nuevo proveedor
        </BotonNuevo>
      </EncabezadoAdmin>

      <InventarioTabs />

      {p.error && <ErrorMessage message={p.error} />}

      <TarjetasResumen items={[{ valor: p.totales.registrados, etiqueta: 'Proveedores registrados' }]} />

      {p.loading ? (
        <LoadingSpinner message="Cargando proveedores…" />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Contacto</th>
                </tr>
              </thead>
              <tbody>
                {p.proveedores.map((prov) => (
                  <tr
                    key={prov.id}
                    onClick={() => {
                      p.setCreando(false)
                      p.seleccionar(prov.id)
                    }}
                    className={`cursor-pointer border-b border-[var(--border)] last:border-none hover:bg-[var(--surface-alt)] ${
                      p.seleccionado?.id === prov.id ? 'bg-[var(--surface-alt)]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-bold">{prov.nombre}</td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">{prov.contacto ?? '—'}</td>
                  </tr>
                ))}
                {p.proveedores.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-[var(--ink-soft)]">
                      No hay proveedores registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <EditorProveedor
            key={p.seleccionado?.id ?? (p.creando ? 'nuevo' : 'vacio')}
            proveedor={p.seleccionado}
            ordenes={p.ordenesDelSeleccionado}
            creando={p.creando}
            guardando={p.guardando}
            onCrear={p.crear}
            onGuardar={p.guardar}
            onEliminar={p.eliminar}
            onCancelar={() => p.setCreando(false)}
          />
        </div>
      )}
    </AdminLayout>
  )
}
