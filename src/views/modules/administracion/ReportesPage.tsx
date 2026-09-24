import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { PanelCard } from './components/panel/PanelCard'
import { formatearMoneda } from './components/constants'
import { useReportes, type PeriodoReporte } from '../../../controllers/administracion/useReportes'

const ALTO_MAXIMO_BARRA = 118

const periodos: { key: PeriodoReporte; label: string }[] = [
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'personalizado', label: 'Personalizado' },
]

export default function ReportesPage() {
  const { usuario, loading, error } = useUsuario()
  const r = useReportes()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <AdminLayout usuario={usuario}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">Administración</div>
          <h1 className="mt-1 text-[27px] font-extrabold">Reportes</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
            {periodos.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => r.setPeriodo(p.key)}
                className={`rounded-full px-[15px] py-[7px] text-[12.5px] font-semibold ${
                  r.periodo === p.key ? 'bg-[var(--orange)] text-white' : 'text-[var(--ink-soft)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[12.5px] font-bold text-[var(--ink)]"
          >
            Exportar reporte
          </button>
        </div>
      </header>

      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{formatearMoneda(r.indicadores.ventasMes)}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Ventas del mes</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{r.indicadores.pedidosMes.toLocaleString('en-US')}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Pedidos del mes</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{formatearMoneda(r.indicadores.ticketPromedioMes)}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Ticket promedio</div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <PanelCard titulo="Ventas por semana" subtitulo="Ingresos totales · últimas 4 semanas">
            <div className="flex h-40 items-end gap-4">
              {r.ventasPorSemana.map((v) => (
                <div key={v.semana} className="flex h-full flex-1 flex-col items-center justify-end">
                  <div
                    className={`mb-1.5 text-[10.5px] font-bold ${v.actual ? 'text-[var(--orange-dark)]' : 'text-[var(--ink-soft)]'}`}
                  >
                    {formatearMoneda(v.total)}
                  </div>
                  <div
                    className="w-full max-w-12 rounded-t-lg rounded-b-sm"
                    style={{
                      height: (v.total / r.ventaMaxima) * ALTO_MAXIMO_BARRA,
                      background: v.actual ? 'linear-gradient(180deg, #ffb877, var(--orange))' : 'var(--orange-bg)',
                    }}
                  />
                  <div
                    className={`mt-2 text-[11px] ${v.actual ? 'font-bold text-[var(--orange-dark)]' : 'font-semibold text-[var(--ink-soft)]'}`}
                  >
                    {v.semana}
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>

          <PanelCard titulo="Horas pico" subtitulo="Cuándo llegan más pedidos">
            <div className="flex flex-col gap-3">
              {r.horasPico.map((h) => (
                <div key={h.rango} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-[12.5px] font-semibold text-[var(--ink-soft)]">{h.rango}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--gray-bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--orange)]"
                      style={{ width: `${h.intensidad}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-[11.5px] font-bold text-[var(--ink-soft)]">
                    {h.etiqueta}
                  </span>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>

        <PanelCard titulo="Ventas por categoría" subtitulo="Participación del mes">
          <div className="flex flex-col gap-3.5">
            {r.ventasPorCategoria.map((c) => (
              <div key={c.categoria}>
                <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                  <span className="font-bold">{c.categoria}</span>
                  <span className="text-[var(--ink-soft)]">
                    {c.porcentaje}% · {formatearMoneda(c.monto)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--gray-bg)]">
                  <div className="h-full rounded-full bg-[var(--orange)]" style={{ width: `${c.porcentaje}%` }} />
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </AdminLayout>
  )
}
