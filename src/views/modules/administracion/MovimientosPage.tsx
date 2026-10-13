import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { InventarioTabs } from './components/InventarioTabs'
import { useMovimientos } from '../../../controllers/administracion/useMovimientos'
import type { TipoMovimiento } from '../../../models/types'

const clasePorTipo: Record<TipoMovimiento, { borde: string; chip: string; label: string }> = {
  entrada: { borde: 'border-l-[var(--green)]', chip: 'bg-[var(--green-bg)] text-[var(--green)]', label: 'Entrada' },
  salida: { borde: 'border-l-[var(--orange)]', chip: 'bg-[var(--orange-bg)] text-[var(--orange-dark)]', label: 'Salida' },
  merma: { borde: 'border-l-[var(--red)]', chip: 'bg-[var(--red-bg)] text-[var(--red)]', label: 'Merma' },
  ajuste: { borde: 'border-l-[var(--green)]', chip: 'bg-[var(--green-bg)] text-[var(--green)]', label: 'Ajuste' },
}

function formatearFecha(iso: string) {
  const fecha = new Date(iso)
  const hoy = new Date().toDateString() === fecha.toDateString()
  const hora = fecha.toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' })
  return hoy ? `hoy ${hora}` : fecha.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }) + ` ${hora}`
}

export default function MovimientosPage() {
  const { usuario, loading: loadingUsuario, error: errorUsuario } = useUsuario()
  const m = useMovimientos()

  if (loadingUsuario) return <LoadingSpinner message="Cargando tu perfil…" />
  if (errorUsuario) return <ErrorMessage message={errorUsuario} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    <AdminLayout usuario={usuario}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">
            Administración · Inventario
          </div>
          <h1 className="mt-1 text-[27px] font-extrabold">Movimientos</h1>
        </div>
        <input
          type="text"
          placeholder="Buscar por insumo..."
          value={m.busqueda}
          onChange={(e) => m.setBusqueda(e.target.value)}
          className="w-64 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px]"
        />
      </header>

      <InventarioTabs />

      {m.error && <ErrorMessage message={m.error} />}

      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{m.totales.total}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Movimientos hoy</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{m.totales.salidasPorVenta}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Salidas por venta hoy</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold text-[var(--red)]">{m.totales.mermas}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Mermas registradas hoy</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {m.filtros.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => m.setFiltro(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
              m.filtro === f.key
                ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div>
          {m.loading ? (
            <LoadingSpinner message="Cargando movimientos…" />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Insumo</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">Referencia</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {m.movimientos.map((mov) => {
                    const c = clasePorTipo[mov.tipo]
                    const signo = mov.tipo === 'salida' || mov.tipo === 'merma' ? '-' : '+'
                    return (
                      <tr key={mov.id} className={`border-b border-l-4 border-[var(--border)] last:border-b-0 ${c.borde}`}>
                        <td className="px-4 py-3">
                          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${c.chip}`}>
                            {c.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold">{mov.insumo}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--ink-soft)]">
                          {signo}
                          {mov.cantidad} {mov.unidad}
                        </td>
                        <td className="px-4 py-3 text-[var(--ink-soft)]">{mov.referencia ?? '—'}</td>
                        <td className="px-4 py-3 text-[var(--ink-soft)]">{mov.responsable}</td>
                        <td className="px-4 py-3 text-[var(--ink-soft)]">{formatearFecha(mov.fecha)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2.5 text-xs text-[var(--ink-soft)]">Mostrando {m.movimientos.length} movimientos</p>
        </div>

        <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="mb-1 text-base font-extrabold">Registrar ajuste manual</p>
          <p className="mb-4 text-[11.5px] text-[var(--ink-soft)]">Para mermas o correcciones de conteo</p>

          <div className="flex flex-col gap-3 text-[13px]">
            <select
              value={m.insumoId}
              onChange={(e) => m.setInsumoId(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2"
            >
              <option value="">Seleccionar insumo…</option>
              {m.insumos.map((insumo) => (
                <option key={insumo.id} value={insumo.id}>
                  {insumo.nombre}
                </option>
              ))}
            </select>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Tipo de ajuste</p>
              <div className="flex gap-1.5">
                {m.tiposAjuste.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => m.setTipoAjuste(t.key)}
                    className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold ${
                      m.tipoAjuste === t.key
                        ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                        : 'border-[var(--border)] text-[var(--ink-soft)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.001"
                step="0.001"
                placeholder="0"
                value={m.cantidad}
                onChange={(e) => m.setCantidad(e.target.value)}
                className="w-1/2 rounded-lg border border-[var(--border)] px-3 py-2"
              />
              <span className="text-[12px] text-[var(--ink-soft)]">
                {m.insumos.find((i) => i.id === m.insumoId)?.unidad_de_medida ?? ''}
              </span>
              {m.insumoId && (
                <span className="ml-auto text-[11px] text-[var(--ink-soft)]">Disponible: {m.stockDisponible}</span>
              )}
            </div>
            {m.excedeStock && (
              <p className="text-[12px] text-[var(--red)]">La merma no puede ser mayor al stock disponible.</p>
            )}

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Motivo</p>
              <div className="flex flex-wrap gap-1.5">
                {m.motivosAjuste.map((motivo) => (
                  <button
                    key={motivo}
                    type="button"
                    onClick={() => m.setMotivo(motivo)}
                    className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold ${
                      m.motivo === motivo
                        ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                        : 'border-[var(--border)] text-[var(--ink-soft)]'
                    }`}
                  >
                    {motivo}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Nota adicional (opcional)"
              rows={2}
              value={m.nota}
              onChange={(e) => m.setNota(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2"
            />

            <p className="rounded-lg border border-dashed border-[var(--border)] p-3 text-[11px] text-[var(--ink-soft)]">
              Este ajuste queda registrado en el historial — no se puede editar, solo revertir con otro ajuste.
            </p>

            <button
              type="button"
              onClick={m.registrar}
              disabled={m.guardando || !m.insumoId || !m.cantidad || m.excedeStock}
              className="rounded-lg bg-[var(--orange)] py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
            >
              {m.guardando ? 'Registrando…' : 'Registrar ajuste'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
