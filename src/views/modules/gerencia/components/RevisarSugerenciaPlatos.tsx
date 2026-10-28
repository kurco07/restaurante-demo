import { useState } from 'react'
import type { PlatoAprobado, SugerenciaPlatos } from '../../../../models/types'
import { formatearMoneda } from '../../../components/ui/constants'

interface Fila {
  incluido: boolean
  porciones: string
}

interface RevisarSugerenciaPlatosProps {
  sugerencia: SugerenciaPlatos
  // A qué sede va: cada cocina ve solo la lista de su sede
  nombreSede?: string
  guardando: boolean
  onAprobar: (items: PlatoAprobado[]) => void
  onRechazar: (motivo: string) => void
}

// Revisión de los platos sugeridos para hoy (Fase 6, Módulos 3 y 5):
// gerencia quita platos o cambia porciones y aprueba. Lo aprobado lo ve
// cocina, sin precios. No cambia el menú ni el inventario.
export function RevisarSugerenciaPlatos({ sugerencia, nombreSede, guardando, onAprobar, onRechazar }: RevisarSugerenciaPlatosProps) {
  const [filas, setFilas] = useState<Record<string, Fila>>(() =>
    Object.fromEntries(sugerencia.items.map((i) => [i.menu_item_id, { incluido: true, porciones: String(i.porciones) }])),
  )
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')

  function cambiar(id: string, cambios: Partial<Fila>) {
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], ...cambios } }))
  }

  const marcados = sugerencia.items.filter((i) => filas[i.menu_item_id].incluido)
  const invalidos = marcados.filter((i) => {
    const n = Number(filas[i.menu_item_id].porciones)
    return !Number.isInteger(n) || n < 1
  })

  return (
    <section className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-[18px]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[17px] font-extrabold">Platos a preparar hoy{nombreSede && ` · ${nombreSede}`}</p>
          <p className="text-xs text-[var(--ink-soft)]">
            Generada el {new Date(sugerencia.generada_en).toLocaleString('es')}
            {sugerencia.modelo && ` · ${sugerencia.modelo}`}
          </p>
        </div>
        <span className="rounded-full bg-[var(--orange-bg)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--orange-dark)]">
          Pendiente de revisar
        </span>
      </div>

      {sugerencia.resumen && <p className="mb-4 rounded-xl bg-[var(--surface-alt)] px-4 py-3 text-[13px]">{sugerencia.resumen}</p>}

      <div className="-mx-1 overflow-x-auto">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.05em] text-[var(--ink-soft)]">
              {['', 'Plato', 'Porciones', 'Datos', 'Por qué'].map((c) => (
                <th key={c} className="whitespace-nowrap px-1 pb-2 font-bold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sugerencia.items.map((i) => {
              const f = filas[i.menu_item_id]
              return (
                <tr key={i.menu_item_id} className={`border-b border-[var(--border)] align-top last:border-0 ${f.incluido ? '' : 'opacity-50'}`}>
                  <td className="px-1 py-2">
                    <input
                      type="checkbox"
                      checked={f.incluido}
                      onChange={(e) => cambiar(i.menu_item_id, { incluido: e.target.checked })}
                      aria-label={`Incluir ${i.plato}`}
                    />
                  </td>
                  <td className="px-1 py-2 font-bold">{i.plato}</td>
                  <td className="whitespace-nowrap px-1 py-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={f.porciones}
                      disabled={!f.incluido}
                      onChange={(e) => cambiar(i.menu_item_id, { porciones: e.target.value })}
                      className="w-[70px] rounded-lg border border-[var(--border)] px-2 py-1"
                    />
                  </td>
                  <td className="whitespace-nowrap px-1 py-2 text-[var(--ink-soft)]">
                    <div>Se venden ~{Number(i.ventas_esperadas).toLocaleString('es')} este día</div>
                    <div>{i.porciones_posibles == null ? 'Stock sin límite conocido' : `Alcanza para ${i.porciones_posibles}`}</div>
                    {i.margen != null && (
                      <div>
                        Margen {formatearMoneda(Number(i.margen))}
                        {i.margen_pct != null && ` (${Number(i.margen_pct).toLocaleString('es')}%)`}
                      </div>
                    )}
                    {i.por_vencer.length > 0 && (
                      <div className="font-semibold text-[var(--orange-dark)]">
                        Vence: {i.por_vencer.map((v) => `${v.insumo.replace(/^Demo · /, '')} (${v.dias === 0 ? 'hoy' : `${v.dias} d`})`).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="min-w-[200px] px-1 py-2 text-[var(--ink-soft)]">{i.motivo || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sugerencia.sin_stock.length > 0 && (
        <p className="mt-4 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[12.5px] text-[var(--red)]">
          <b>Sin stock para hoy, aunque se suelen pedir:</b>{' '}
          {sugerencia.sin_stock
            .map((s) => `${s.plato}${s.insumo_limitante ? ` (falta ${s.insumo_limitante.replace(/^Demo · /, '')})` : ''}`)
            .join(', ')}
          . Considera marcarlos como no disponibles en el menú.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <p className="text-[13px]">
          <b>{marcados.length}</b> de {sugerencia.items.length} platos
          {invalidos.length > 0 && (
            <span className="block text-xs font-semibold text-[var(--red)]">
              Las porciones tienen que ser un número entero, al menos 1: {invalidos.map((i) => i.plato).join(', ')}
            </span>
          )}
        </p>
        {!rechazando ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRechazando(true)}
              disabled={guardando}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-[13px] font-semibold text-[var(--ink-soft)] disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() =>
                onAprobar(marcados.map((i) => ({ menu_item_id: i.menu_item_id, porciones: Number(filas[i.menu_item_id].porciones) })))
              }
              disabled={guardando || marcados.length === 0 || invalidos.length > 0}
              className="rounded-full bg-[var(--orange)] px-5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : `Aprobar y enviar a cocina${nombreSede ? ` · ${nombreSede}` : ''}`}
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <input
              autoFocus
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="¿Por qué la rechazas?"
              className="min-w-[220px] flex-1 rounded-full border border-[var(--border)] px-4 py-2 text-[13px]"
            />
            <button type="button" onClick={() => setRechazando(false)} className="rounded-full px-3 py-2 text-[13px] font-semibold text-[var(--ink-soft)]">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onRechazar(motivo)}
              disabled={guardando || !motivo.trim()}
              className="rounded-full bg-[var(--red)] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
