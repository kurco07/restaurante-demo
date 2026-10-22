import { useKpisGerencia } from '../../../controllers/gerencia/useKpisGerencia'
import { ETIQUETA_METODO_PAGO, formatearMoneda } from '../../components/ui/constants'
import { PanelCard } from '../../components/ui/PanelCard'
import { ListaBarras } from './components/ListaBarras'
import { SeccionGerencia } from './components/SeccionGerencia'
import { VentasPorDia } from './components/VentasPorDia'

function cuentas(n: number) {
  return `${n} ${n === 1 ? 'cuenta' : 'cuentas'}`
}

// Ventas del período (Fase 5, Módulo 1): totales, por día, por plato,
// por hora, por categoría, por medio de pago y por mesonero.
export default function VentasPage() {
  const k = useKpisGerencia()
  const d = k.datos

  return (
    <SeccionGerencia titulo="Ventas" subtitulo="Cuentas cerradas en el período">
      {d && (
        <>
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
                    etiqueta: ETIQUETA_METODO_PAGO[m.metodo] ?? m.metodo,
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
            </div>
          </div>
        </>
      )}
    </SeccionGerencia>
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
