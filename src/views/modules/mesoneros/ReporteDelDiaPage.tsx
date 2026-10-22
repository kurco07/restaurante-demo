import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useEstadoConexion } from '../../../controllers/useEstadoConexion'
import { useReporteDiario } from '../../../controllers/reportes/useReporteDiario'
import { puedeSupervisar } from '../../../lib/permisos'
import { ESTILOS_ADMIN } from '../../components/ui/constants'
import { ReporteDiarioVista } from '../../components/reportes/ReporteDiarioVista'

function fechaLarga(dia: string) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Reporte del día del supervisor (Fase 5, Módulo 2): solo hoy y solo su
// sede, para cuadrar la caja al cierre. A diferencia del resto del módulo
// del mesonero, necesita internet: se calcula en el servidor, que además
// es el que verifica el rol. Sin conexión solo esta pantalla se detiene.
export default function ReporteDelDiaPage() {
  const { usuario } = useUsuario()
  if (!usuario) return null
  if (!puedeSupervisar(usuario.rol)) {
    return <p className="py-16 text-center text-sm text-[var(--ink-soft)]">El reporte del día es solo para supervisores.</p>
  }
  return <ReporteDelDia sedeId={usuario.sede_id ?? undefined} />
}

function ReporteDelDia({ sedeId }: { sedeId?: string }) {
  const { datos, cargando, error, recargar } = useReporteDiario(undefined, sedeId)
  const { conectado } = useEstadoConexion()

  return (
    <div className="mx-auto max-w-[1100px] text-[var(--ink)]" style={ESTILOS_ADMIN}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">Reporte del día</div>
          <h1 className="mt-1 text-[27px] font-extrabold first-letter:uppercase">
            {datos ? fechaLarga(datos.dia) : 'Hoy'}
          </h1>
          <p className="mt-0.5 text-xs text-[var(--ink-soft)]">Cuentas cobradas y anulaciones de hoy en tu sede</p>
        </div>
        <button
          type="button"
          onClick={recargar}
          disabled={cargando}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[12.5px] font-semibold text-[var(--ink-soft)] disabled:opacity-60"
        >
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </button>
      </header>

      {!conectado && (
        <p className="mb-5 rounded-xl bg-[var(--gray-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--ink-soft)]">
          Sin conexión: el reporte se calcula en el servidor y necesita internet. Mesas, menú y pedidos siguen
          funcionando normalmente.
        </p>
      )}

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
    </div>
  )
}
