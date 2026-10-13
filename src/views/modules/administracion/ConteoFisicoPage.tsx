import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useConteoFisico } from '../../../controllers/administracion/useConteoFisico'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { InventarioTabs } from './components/InventarioTabs'
import { EncabezadoAdmin, TarjetasResumen } from './components/comunes'

export default function ConteoFisicoPage() {
  const { usuario, loading, error } = useUsuario()
  const c = useConteoFisico()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  async function handleRegistrar() {
    const total = c.filasConDiferencia.length
    if (!confirm(`¿Registrar el conteo? ${total} ${total === 1 ? 'insumo tiene' : 'insumos tienen'} diferencia con el stock teórico.`)) {
      return
    }
    try {
      await c.registrarConteo()
    } catch {
      // el error ya queda en c.error, se muestra abajo
    }
  }

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoAdmin ruta="Administración · Inventario" titulo="Conteo físico" />

      <InventarioTabs />

      {c.error && <ErrorMessage message={c.error} />}

      <p className="mb-4 text-[13px] text-[var(--ink-soft)]">
        Solo insumos de tipo "exacto" — los de tipo "por lote" se reconcilian abriendo/cerrando lotes, y los
        "estimado" no se rastrean con precisión (ver <code>arquitectura.md</code>).
      </p>

      <TarjetasResumen
        items={[
          { valor: c.filas.length, etiqueta: 'Insumos contables' },
          { valor: c.filasConDiferencia.length, etiqueta: 'Con diferencia', alerta: c.filasConDiferencia.length > 0 },
        ]}
      />

      {c.loading ? (
        <LoadingSpinner message="Cargando insumos…" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                <th className="px-4 py-3">Insumo</th>
                <th className="px-4 py-3">Stock teórico</th>
                <th className="px-4 py-3">Contado</th>
                <th className="px-4 py-3">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {c.filas.map((fila) => (
                <tr key={fila.insumo.id} className="border-b border-[var(--border)] last:border-none">
                  <td className="px-4 py-3 font-bold">{fila.insumo.nombre}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">
                    {fila.teorico} {fila.insumo.unidad_de_medida}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="sin contar"
                      value={fila.contado}
                      onChange={(e) => c.setContado(fila.insumo.id, e.target.value)}
                      className="w-28 rounded-lg border border-[var(--border)] px-2 py-1.5"
                    />
                  </td>
                  <td
                    className={`px-4 py-3 font-bold ${
                      fila.diferencia === null || fila.diferencia === 0
                        ? 'text-[var(--ink-soft)]'
                        : fila.diferencia > 0
                          ? 'text-[var(--green)]'
                          : 'text-[var(--red)]'
                    }`}
                  >
                    {fila.diferencia === null
                      ? '—'
                      : `${fila.diferencia > 0 ? '+' : ''}${fila.diferencia} ${fila.insumo.unidad_de_medida}`}
                  </td>
                </tr>
              ))}
              {c.filas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[var(--ink-soft)]">
                    No hay insumos de tipo "exacto" para contar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={handleRegistrar}
        disabled={c.guardando || c.filasConDiferencia.length === 0}
        className="mt-4 rounded-lg bg-[var(--orange)] px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
      >
        {c.guardando ? 'Registrando…' : `Registrar conteo (${c.filasConDiferencia.length})`}
      </button>
    </AdminLayout>
  )
}
