import { useKpisGerencia } from '../../../controllers/gerencia/useKpisGerencia'
import { useComparacionSedes, type FilaComparacionSede } from '../../../controllers/gerencia/useComparacionSedes'
import { formatearMoneda } from '../../components/ui/constants'
import { PanelCard } from '../../components/ui/PanelCard'
import { ListaBarras } from './components/ListaBarras'
import { SeccionGerencia } from './components/SeccionGerencia'

function pct(valor: number | null) {
  return valor == null ? '—' : `${valor.toLocaleString('es', { maximumFractionDigits: 1 })}%`
}

// Comparación entre sedes (Fase 5, Módulo 3): las mismas cifras del panel,
// una fila por sede, en el período elegido. Aquí no se filtra por sede.
export default function SedesPage() {
  const k = useKpisGerencia()
  const c = useComparacionSedes(k.rango.desde, k.rango.hasta, k.sedes)
  const totalVentas = c.filas.reduce((t, f) => t + Number(f.ventas), 0)

  return (
    <SeccionGerencia titulo="Sedes" subtitulo="Comparación entre las sedes del restaurante en el período" sinSelectorSede>
      {c.error && (
        <p className="mb-5 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--red)]">
          No se pudo cargar la comparación: {c.error}
        </p>
      )}

      {c.cargando && c.filas.length === 0 && <p className="py-16 text-center text-sm text-[var(--ink-soft)]">Cargando…</p>}

      {c.filas.length > 0 && (
        <div className={c.cargando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {c.filas.length === 1 && (
            <p className="mb-5 rounded-xl bg-[var(--orange-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--orange-dark)]">
              Tu restaurante tiene una sola sede: todavía no hay con qué comparar.
            </p>
          )}

          <PanelCard titulo="Ventas por sede" subtitulo="Parte de las ventas del período que hizo cada sede">
            <ListaBarras
              vacio="Sin ventas en el período."
              filas={c.filas
                .filter((f) => Number(f.ventas) > 0)
                .map((f) => ({
                  clave: f.sede_id,
                  etiqueta: f.sede,
                  valor: Number(f.ventas),
                  detalle: `${formatearMoneda(Number(f.ventas))} · ${pct(totalVentas ? (Number(f.ventas) / totalVentas) * 100 : null)}`,
                }))}
            />
          </PanelCard>

          <PanelCard titulo="Comparación" subtitulo="Margen, merma e inventario con el costo de las compras de cada sede">
            <TablaSedes filas={c.filas} />
          </PanelCard>
        </div>
      )}
    </SeccionGerencia>
  )
}

const COLUMNAS = ['Sede', 'Ventas', 'Cuentas', 'Ticket prom.', 'Propinas', 'Margen bruto', 'Anulado', 'Merma', 'Inventario hoy']

function TablaSedes({ filas }: { filas: FilaComparacionSede[] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.05em] text-[var(--ink-soft)]">
            {COLUMNAS.map((c) => (
              <th key={c} className="whitespace-nowrap px-1 pb-2 font-bold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.sede_id} className="border-b border-[var(--border)] last:border-0">
              <td className="whitespace-nowrap px-1 py-2 font-bold">{f.sede}</td>
              <td className="px-1 py-2">{formatearMoneda(Number(f.ventas))}</td>
              <td className="px-1 py-2">{f.cuentas}</td>
              <td className="px-1 py-2">{formatearMoneda(Number(f.ticket_promedio))}</td>
              <td className="px-1 py-2">{formatearMoneda(Number(f.propinas))}</td>
              <td className="whitespace-nowrap px-1 py-2">
                {f.ganancia == null ? (
                  <span className="text-[var(--ink-soft)]" title="Ningún plato vendido tiene costo completo en esta sede">
                    —
                  </span>
                ) : (
                  <>
                    {formatearMoneda(f.ganancia)} <span className="text-[var(--ink-soft)]">· {pct(f.margenPct)}</span>
                  </>
                )}
              </td>
              <td className={`whitespace-nowrap px-1 py-2 ${Number(f.platos_anulados) > 0 ? 'text-[var(--red)]' : ''}`}>
                {Number(f.platos_anulados) > 0 ? `${formatearMoneda(Number(f.importe_anulado))} · ${f.platos_anulados} u` : '—'}
              </td>
              <td className="px-1 py-2">{Number(f.valor_merma) > 0 ? formatearMoneda(Number(f.valor_merma)) : '—'}</td>
              <td className="whitespace-nowrap px-1 py-2">
                {formatearMoneda(Number(f.valor_inventario))}
                {Number(f.insumos_sin_costo) > 0 && (
                  <span
                    className="ml-1 text-[11px] text-[var(--orange-dark)]"
                    title="Insumos con stock que nunca se compraron en esta sede: no entran en el valor"
                  >
                    (+{f.insumos_sin_costo} sin costo)
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
