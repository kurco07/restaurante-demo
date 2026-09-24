import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { InventarioTabs } from './components/InventarioTabs'
import { EstadoChip } from './components/panel/EstadoChip'
import { useProveedores } from '../../../controllers/administracion/useProveedores'

export default function ProveedoresPage() {
  const { usuario, loading, error } = useUsuario()
  const p = useProveedores()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <AdminLayout usuario={usuario}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">
            Administración · Inventario
          </div>
          <h1 className="mt-1 text-[27px] font-extrabold">Proveedores</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={p.busqueda}
            onChange={(e) => p.setBusqueda(e.target.value)}
            className="w-56 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px]"
          />
          <button type="button" className="whitespace-nowrap rounded-full bg-[var(--orange)] px-4 py-2.5 text-[12.5px] font-bold text-white">
            + Nuevo proveedor
          </button>
        </div>
      </header>

      <InventarioTabs />

      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{p.totales.registrados}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Proveedores registrados</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{p.totales.insumosCubiertos}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Insumos cubiertos</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold text-[var(--red)]">{p.totales.inactivos}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Proveedor inactivo</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {p.categorias.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => p.setCategoria(cat)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
              p.categoria === cat
                ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Insumos</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {p.proveedores.map((prov) => (
                <tr
                  key={prov.id}
                  onClick={() => p.setSeleccionadoId(prov.id)}
                  className={`cursor-pointer border-b border-[var(--border)] last:border-none hover:bg-[var(--surface-alt)] ${
                    p.seleccionado?.id === prov.id ? 'bg-[var(--surface-alt)]' : ''
                  } ${!prov.activo ? 'opacity-50' : ''}`}
                >
                  <td className="flex items-center gap-2.5 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--orange-bg)] text-[11px] font-extrabold text-[var(--orange-dark)]">
                      {prov.id}
                    </span>
                    <div>
                      <div className="font-bold">{prov.nombre}</div>
                      <div className="text-[11px] text-[var(--ink-soft)]">{prov.categoria}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{prov.telefono}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{prov.entregaEstimada}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">
                    {prov.insumos.length} {prov.insumos.length === 1 ? 'insumo' : 'insumos'}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoChip tono={prov.activo ? 'verde' : 'naranja'}>{prov.activo ? 'Activo' : 'Inactivo'}</EstadoChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {p.seleccionado ? (
            <>
              <p className="mb-4 text-base font-extrabold">Editor de proveedor</p>
              <div className="flex flex-col gap-3 text-[13px]">
                <Campo label="Nombre" valor={p.seleccionado.nombre} />
                <Campo label="Categoría principal" valor={p.seleccionado.categoria} />
                <Campo label="Teléfono" valor={p.seleccionado.telefono} />
                <Campo label="Entrega estimada" valor={p.seleccionado.entregaEstimada} />
                <Campo label="Correo" valor={p.seleccionado.correo} />
                <Campo label="Forma de pago" valor={p.seleccionado.formaPago} />
                {p.seleccionado.nota && <Campo label="Nota" valor={p.seleccionado.nota} />}

                <label className="mt-1 flex items-center justify-between text-[12.5px] font-semibold">
                  Proveedor activo
                  <span
                    className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 ${
                      p.seleccionado.activo ? 'bg-[var(--orange)]' : 'bg-[var(--border)]'
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        p.seleccionado.activo ? 'translate-x-4' : ''
                      }`}
                    />
                  </span>
                </label>

                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                    Insumos que suministra
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.seleccionado.insumos.map((insumo) => (
                      <span key={insumo} className="rounded-full bg-[var(--orange-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--orange-dark)]">
                        {insumo}
                      </span>
                    ))}
                  </div>
                </div>

                <a href="/proximamente" className="text-xs font-bold text-[var(--orange-dark)]">
                  Ver órdenes de compra →
                </a>

                <div className="mt-2 flex gap-2">
                  <button type="button" className="flex-1 rounded-lg bg-[var(--orange)] py-2.5 text-[13px] font-bold text-white">
                    Guardar cambios
                  </button>
                  <button type="button" className="rounded-lg px-3 text-[13px] font-bold text-[var(--red)]">
                    Eliminar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">Selecciona un proveedor para ver su ficha.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">{label}</p>
      <p className="rounded-lg bg-[var(--surface-alt)] px-3 py-2 font-semibold">{valor}</p>
    </div>
  )
}
