import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { useMesasAdmin } from '../../../controllers/administracion/useMesasAdmin'
import type { MesaEditable } from '../../../models/types'

const claseSegunEstado: Record<MesaEditable['estado'], string> = {
  libre: 'border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]',
  ocupada: 'border-[var(--orange)] bg-[var(--orange-bg)] text-[var(--orange-dark)]',
  limpiar: 'border-[var(--border)] bg-[var(--gray-bg)] text-[var(--ink-soft)]',
}

export default function MesasAdminPage() {
  const { usuario, loading, error } = useUsuario()
  const m = useMesasAdmin()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <AdminLayout usuario={usuario}>
      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">Administración</div>
        <h1 className="mt-1 text-[27px] font-extrabold">Mesas</h1>
        <p className="mt-1 text-[12.5px] text-[var(--ink-soft)]">
          Este es el mismo mapa que ve el mesonero — aquí lo configuras, ellos solo lo ven.
        </p>
      </header>

      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{m.totales.total}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Mesas totales</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{m.totales.ocupadas}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Ocupadas ahora</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold text-[var(--red)]">{m.totales.demoradas}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Mesa demorada</div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
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
              {f.label} · {m.contador(f.key)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink)]">
            + Agregar mesa
          </button>
          <button
            type="button"
            onClick={() => m.setEditando((e) => !e)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
              m.editando ? 'bg-[var(--orange)] text-white' : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
            }`}
          >
            {m.editando ? '✎ Editando — clic para bloquear' : '🔒 Bloqueado — clic para editar'}
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-3.5 text-[11px] text-[var(--ink-soft)]">
        <Leyenda color="border-[var(--orange)] bg-[var(--orange-bg)]" label="Ocupada" />
        <Leyenda color="border-[var(--red)] bg-[var(--red-bg)]" label="Demorada" />
        <Leyenda color="border-dashed border-[var(--border)] bg-[var(--surface)]" label="Libre" />
        <Leyenda color="border-[var(--border)] bg-[var(--gray-bg)]" label="Por limpiar" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.65fr_1fr]">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="relative h-[460px] w-full overflow-hidden rounded-xl border-2 border-[var(--border)] bg-[var(--gray-bg)]">
            <div className="absolute right-0 top-0 flex h-[30%] w-[22%] items-center justify-center border-2 border-[var(--border)] bg-[var(--surface-alt)] text-[11px] font-extrabold uppercase tracking-wide text-[var(--ink-soft)]">
              Cocina
            </div>
            <div className="absolute right-0 top-[30%] flex h-[14%] w-[14%] items-center justify-center border-2 border-[var(--border)] bg-[var(--surface-alt)] text-[9px] font-extrabold uppercase text-[var(--ink-soft)]">
              Baños
            </div>
            <div className="absolute right-[2%] bottom-[4%] flex h-[14%] w-[24%] items-center justify-center gap-2 rounded-lg border-2 border-[var(--orange)] bg-[var(--orange-bg)]">
              {['B1', 'B2', 'B3', 'B4'].map((b, i) => (
                <div
                  key={b}
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-extrabold ${
                    i === 1 ? 'bg-[var(--orange)] text-white' : 'border border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
                  }`}
                >
                  {b}
                </div>
              ))}
            </div>

            {m.mesas.map((mesa) => (
              <button
                key={mesa.numero}
                type="button"
                onClick={() => m.setSeleccionada(mesa.numero)}
                style={{
                  left: mesa.left,
                  top: mesa.top,
                  opacity: m.coincideFiltro(mesa) ? 1 : 0.25,
                  pointerEvents: m.coincideFiltro(mesa) ? 'auto' : 'none',
                  cursor: m.editando ? 'grab' : 'pointer',
                }}
                className={`absolute flex h-14 w-14 flex-col items-center justify-center border-2 text-center shadow-sm transition-shadow hover:shadow-md ${
                  mesa.forma === 'round' ? 'rounded-full' : 'rounded-xl'
                } ${mesa.demorada ? 'border-[var(--red)] bg-[var(--red-bg)] text-[var(--red)]' : claseSegunEstado[mesa.estado]} ${
                  m.seleccionada === mesa.numero ? 'ring-2 ring-[var(--orange)] ring-offset-1' : ''
                }`}
              >
                <span className="text-sm font-extrabold leading-none">{mesa.numero}</span>
                <span className="mt-0.5 text-[8px] font-bold leading-none">
                  {mesa.estado === 'libre' ? 'Libre' : mesa.estado === 'limpiar' ? 'Limpiar' : mesa.status === 'cuenta' ? 'Cuenta' : mesa.tiempo}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {m.mesaSeleccionada ? (
            <>
              <p className="mb-4 text-base font-extrabold">Editor de mesa</p>
              <div className="flex flex-col gap-3 text-[13px]">
                <Campo label="Número" valor={String(m.mesaSeleccionada.numero)} />
                <Campo label="Zona" valor={m.mesaSeleccionada.zona} />
                <Campo label="Capacidad" valor={`${m.mesaSeleccionada.capacidad} personas`} />
                <Campo label="Forma" valor={m.mesaSeleccionada.forma === 'round' ? 'Redonda' : 'Cuadrada'} />

                <label className="mt-1 flex items-center justify-between text-[12.5px] font-semibold">
                  Mesa activa (visible en el salón)
                  <span
                    className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 ${
                      m.mesaSeleccionada.activa ? 'bg-[var(--orange)]' : 'bg-[var(--border)]'
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        m.mesaSeleccionada.activa ? 'translate-x-4' : ''
                      }`}
                    />
                  </span>
                </label>

                {m.mesaSeleccionada.demorada && (
                  <p className="rounded-lg border border-dashed border-[var(--border)] p-3 text-[11.5px] text-[var(--ink-soft)]">
                    Ocupada hace {m.mesaSeleccionada.tiempo} — por encima del tiempo esperado (demorada). Mesero
                    asignado: {m.mesaSeleccionada.mesero}. El estado se actualiza solo, según los pedidos activos — no
                    se edita aquí.
                  </p>
                )}

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
            <p className="text-sm text-[var(--ink-soft)]">Toca una mesa del plano para editarla.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

function Leyenda({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm border ${color}`} />
      {label}
    </span>
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
