import { Link } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { PERIODOS_KPI, useKpisVentas } from '../../../controllers/gerencia/useKpisVentas'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ESTILOS_ADMIN, formatearMoneda } from '../../components/ui/constants'
import { PanelCard } from '../../components/ui/PanelCard'
import { ListaBarras } from './components/ListaBarras'
import { VentasPorDia } from './components/VentasPorDia'

const ETIQUETA_METODO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  pago_movil: 'Pago móvil',
}

function cuentas(n: number) {
  return `${n} ${n === 1 ? 'cuenta' : 'cuentas'}`
}

// Dashboard de gerencia (Fase 5, Módulo 1). Por ahora solo ventas:
// rentabilidad por plato y rotación de inventario llegan cuando la Fase 4
// (inventario, costos) esté en main. Requiere conexión: los reportes no
// son offline (arquitectura.md §1).
export default function GerenciaPage() {
  const { usuario, loading, error } = useUsuario()
  const k = useKpisVentas()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  const d = k.datos

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]" style={ESTILOS_ADMIN}>
      <main className="mx-auto max-w-[1280px] px-4 pb-10 pt-7 sm:px-[34px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">Gerencia</div>
            <h1 className="mt-1 text-[27px] font-extrabold">Ventas</h1>
            <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
              Cuentas cerradas en el período · {usuario.nombre}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
              {PERIODOS_KPI.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => k.setPeriodo(p.key)}
                  className={`rounded-full px-[15px] py-[7px] text-[12.5px] font-semibold ${
                    k.periodo === p.key ? 'bg-[var(--orange)] text-white' : 'text-[var(--ink-soft)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Link
              to="/administracion"
              className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[12.5px] font-bold"
            >
              Administración →
            </Link>
          </div>
        </header>

        {k.error && (
          <p className="mb-5 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--red)]">
            No se pudieron cargar las ventas: {k.error}
          </p>
        )}

        {k.cargando && !d && <p className="py-16 text-center text-sm text-[var(--ink-soft)]">Cargando ventas…</p>}

        {d && (
          <div className={k.cargando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <div className="mb-[22px] grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <Tarjeta valor={formatearMoneda(d.resumen.ventas)} etiqueta="Ventas (sin propina)" />
              <Tarjeta valor={String(d.resumen.cuentas)} etiqueta="Cuentas cerradas" />
              <Tarjeta valor={formatearMoneda(d.resumen.ticket_promedio)} etiqueta="Ticket promedio" />
              <Tarjeta valor={formatearMoneda(d.resumen.propinas)} etiqueta="Propinas" />
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0">
                <PanelCard titulo="Ventas por día" subtitulo="Total cobrado por día de cierre">
                  <VentasPorDia dias={k.porDia} />
                </PanelCard>

                <PanelCard titulo="Platos más vendidos" subtitulo="Top 10 por unidades vendidas">
                  <ListaBarras
                    vacio="Sin platos vendidos en el período."
                    filas={d.top_platos.map((p) => ({
                      clave: p.plato,
                      etiqueta: p.plato,
                      valor: p.cantidad,
                      detalle: `${p.cantidad} u · ${formatearMoneda(p.importe)}`,
                    }))}
                  />
                </PanelCard>

                <PanelCard titulo="Horas de más venta" subtitulo="Por hora de cierre de la cuenta">
                  <ListaBarras
                    vacio="Sin ventas en el período."
                    filas={d.por_hora.map((h) => ({
                      clave: String(h.hora),
                      etiqueta: `${String(h.hora).padStart(2, '0')}:00 – ${String((h.hora + 1) % 24).padStart(2, '0')}:00`,
                      valor: h.ventas,
                      detalle: `${formatearMoneda(h.ventas)} · ${cuentas(h.cuentas)}`,
                    }))}
                  />
                </PanelCard>
              </div>

              <div className="min-w-0">
                <PanelCard titulo="Ventas por categoría" subtitulo="Importe de los platos vendidos">
                  <ListaBarras
                    vacio="Sin platos vendidos en el período."
                    filas={d.por_categoria.map((c) => ({
                      clave: c.categoria,
                      etiqueta: c.categoria,
                      valor: c.importe,
                      detalle: `${formatearMoneda(c.importe)} · ${c.cantidad} u`,
                    }))}
                  />
                </PanelCard>

                <PanelCard titulo="Medios de pago" subtitulo="Cobrado por método">
                  <ListaBarras
                    vacio="Sin cobros en el período."
                    filas={d.por_metodo.map((m) => ({
                      clave: m.metodo,
                      etiqueta: ETIQUETA_METODO[m.metodo] ?? m.metodo,
                      valor: m.ventas,
                      detalle: `${formatearMoneda(m.ventas)} · ${cuentas(m.cuentas)}`,
                    }))}
                  />
                </PanelCard>

                <PanelCard titulo="Ventas por mesonero" subtitulo="Mesonero asignado a la mesa">
                  <ListaBarras
                    vacio="Sin ventas en el período."
                    filas={d.por_mesonero.map((m) => ({
                      clave: m.mesonero,
                      etiqueta: m.mesonero,
                      valor: m.ventas,
                      detalle: `${formatearMoneda(m.ventas)} · ${cuentas(m.cuentas)}`,
                    }))}
                  />
                </PanelCard>

                <p className="px-1 text-[11.5px] text-[var(--ink-soft)]">
                  Rentabilidad por plato y rotación de inventario se agregan cuando esté lista la Fase 4 (costos e
                  inventario).
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
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
