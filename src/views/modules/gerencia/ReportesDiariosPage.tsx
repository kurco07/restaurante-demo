import { useState } from 'react'
import {
  claveDia,
  sumarDiasClave,
  useHistorialDiario,
  useReporteDiario,
} from '../../../controllers/reportes/useReporteDiario'
import { formatearMoneda } from '../../components/ui/constants'
import { PanelCard } from '../../components/ui/PanelCard'
import { ReporteDiarioVista } from '../../components/reportes/ReporteDiarioVista'

type Vista = 'dia' | 'historial'

const RANGOS_HISTORIAL = [
  { dias: 7, label: '7 días' },
  { dias: 30, label: '30 días' },
  { dias: 90, label: '90 días' },
]

function fechaLarga(dia: string) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fechaCorta(dia: string) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Reporte por día de gerencia (Fase 5, Módulo 2): el mismo reporte que ve
// el supervisor, pero de cualquier día pasado y de todas las sedes, más el
// historial día por día para comparar. No usa el selector de período del
// resto del panel: aquí la unidad es el día.
export default function ReportesDiariosPage() {
  const hoy = claveDia(new Date())
  const [vista, setVista] = useState<Vista>('dia')
  const [dia, setDia] = useState(hoy)

  function abrirDia(d: string) {
    setDia(d)
    setVista('dia')
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">Gerencia</div>
          <h1 className="mt-1 text-[27px] font-extrabold">Reporte por día</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-soft)]">Ventas, medios de pago y anulaciones de cada día</p>
        </div>
        <div className="flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          {(
            [
              ['dia', 'Un día'],
              ['historial', 'Historial'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setVista(key)}
              className={`rounded-full px-[15px] py-[7px] text-[12.5px] font-semibold ${
                vista === key ? 'bg-[var(--orange)] text-white' : 'text-[var(--ink-soft)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {vista === 'dia' ? <ReporteDeUnDia dia={dia} hoy={hoy} onCambiar={setDia} /> : <Historial onAbrir={abrirDia} />}
    </>
  )
}

function ReporteDeUnDia({ dia, hoy, onCambiar }: { dia: string; hoy: string; onCambiar: (d: string) => void }) {
  const { datos, cargando, error } = useReporteDiario(dia)
  const boton =
    'rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--ink-soft)] disabled:opacity-40'

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" className={boton} onClick={() => onCambiar(sumarDiasClave(dia, -1))}>
          ← Anterior
        </button>
        <input
          type="date"
          value={dia}
          max={hoy}
          onChange={(e) => e.target.value && onCambiar(e.target.value)}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-[7px] text-[12.5px] font-semibold"
        />
        <button type="button" className={boton} disabled={dia >= hoy} onClick={() => onCambiar(sumarDiasClave(dia, 1))}>
          Siguiente →
        </button>
        {dia !== hoy && (
          <button type="button" className={boton} onClick={() => onCambiar(hoy)}>
            Hoy
          </button>
        )}
        <span className="ml-1 text-[13px] font-bold first-letter:uppercase">{fechaLarga(dia)}</span>
      </div>

      {error && (
        <p className="mb-5 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--red)]">
          No se pudo cargar el reporte: {error}
        </p>
      )}

      {cargando && !datos && <p className="py-16 text-center text-sm text-[var(--ink-soft)]">Cargando…</p>}

      {datos && (
        <div className={cargando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <ReporteDiarioVista r={datos} />
        </div>
      )}
    </>
  )
}

function Historial({ onAbrir }: { onAbrir: (d: string) => void }) {
  const [dias, setDias] = useState(30)
  const { filas, cargando, error } = useHistorialDiario(dias)

  const total = filas.reduce(
    (t, f) => ({
      ventas: t.ventas + Number(f.ventas),
      propinas: t.propinas + Number(f.propinas),
      cuentas: t.cuentas + Number(f.cuentas),
      anulados: t.anulados + Number(f.platos_anulados),
      importeAnulado: t.importeAnulado + Number(f.importe_anulado),
    }),
    { ventas: 0, propinas: 0, cuentas: 0, anulados: 0, importeAnulado: 0 },
  )
  const conVentas = filas.filter((f) => Number(f.cuentas) > 0).length

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-1">
        {RANGOS_HISTORIAL.map((r) => (
          <button
            key={r.dias}
            type="button"
            onClick={() => setDias(r.dias)}
            className={`rounded-full border px-[15px] py-[7px] text-[12.5px] font-semibold ${
              dias === r.dias
                ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
            }`}
          >
            Últimos {r.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-5 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--red)]">
          No se pudo cargar el historial: {error}
        </p>
      )}

      {cargando && filas.length === 0 && <p className="py-16 text-center text-sm text-[var(--ink-soft)]">Cargando…</p>}

      {filas.length > 0 && (
        <div className={cargando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="mb-[22px] grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <Tarjeta valor={formatearMoneda(total.ventas)} etiqueta="Ventas del período (sin propina)" />
            <Tarjeta
              valor={formatearMoneda(conVentas ? total.ventas / conVentas : 0)}
              etiqueta={`Promedio por día con ventas (${conVentas})`}
            />
            <Tarjeta valor={String(total.cuentas)} etiqueta="Cuentas cobradas" />
            <Tarjeta
              valor={formatearMoneda(total.importeAnulado)}
              etiqueta={`Anulado (${total.anulados} ${total.anulados === 1 ? 'plato' : 'platos'})`}
            />
          </div>

          <PanelCard titulo="Día por día" subtitulo="Toca un día para ver su reporte completo">
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.05em] text-[var(--ink-soft)]">
                    {['Día', 'Cuentas', 'Ventas', 'Propinas', 'Anulado'].map((c) => (
                      <th key={c} className="whitespace-nowrap px-1 pb-2 font-bold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => {
                    const vacio = Number(f.cuentas) === 0 && Number(f.platos_anulados) === 0
                    return (
                      <tr
                        key={f.dia}
                        onClick={() => onAbrir(f.dia)}
                        className={`cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-alt)] ${
                          vacio ? 'text-[var(--ink-soft)]' : ''
                        }`}
                      >
                        <td className="whitespace-nowrap px-1 py-2 font-bold first-letter:uppercase">{fechaCorta(f.dia)}</td>
                        <td className="px-1 py-2">{f.cuentas}</td>
                        <td className="px-1 py-2">{formatearMoneda(Number(f.ventas))}</td>
                        <td className="px-1 py-2">{formatearMoneda(Number(f.propinas))}</td>
                        <td className={`px-1 py-2 ${Number(f.platos_anulados) > 0 ? 'font-semibold text-[var(--red)]' : ''}`}>
                          {Number(f.platos_anulados) > 0
                            ? `${formatearMoneda(Number(f.importe_anulado))} · ${f.platos_anulados} u`
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </PanelCard>
        </div>
      )}
    </>
  )
}

function Tarjeta({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
      <div className="text-[23px] font-extrabold">{valor}</div>
      <div className="mt-[5px] text-xs text-[var(--ink-soft)]">{etiqueta}</div>
    </div>
  )
}
