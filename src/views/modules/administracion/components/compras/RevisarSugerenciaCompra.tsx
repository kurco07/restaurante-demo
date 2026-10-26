import { useState } from 'react'
import type { ItemAprobadoCompra, PrioridadCompra, Proveedor, SugerenciaCompra } from '../../../../../models/types'
import { formatearMoneda } from '../../../../components/ui/constants'

const ESTILO_PRIORIDAD: Record<PrioridadCompra, string> = {
  alta: 'bg-[var(--red-bg)] text-[var(--red)]',
  media: 'bg-[var(--orange-bg)] text-[var(--orange-dark)]',
  baja: 'bg-[var(--gray-bg)] text-[var(--ink-soft)]',
}

interface Fila {
  incluido: boolean
  cantidad: string
  proveedor_id: string
}

interface RevisarSugerenciaCompraProps {
  sugerencia: SugerenciaCompra
  proveedores: Proveedor[]
  guardando: boolean
  onAprobar: (items: ItemAprobadoCompra[]) => void
  onRechazar: (motivo: string) => void
}

function cantidad(valor: number, unidad: string) {
  return `${Number(valor).toLocaleString('es', { maximumFractionDigits: 3 })} ${unidad}`
}

// Revisión de una sugerencia de compra pendiente (Fase 6, Módulo 5): cada
// insumo se puede quitar, cambiar de cantidad o de proveedor antes de
// aprobar. Lo que la IA propuso no comprar (cantidad 0) viene desmarcado.
// Aprobar crea un borrador por proveedor; no compra nada todavía.
export function RevisarSugerenciaCompra({ sugerencia, proveedores, guardando, onAprobar, onRechazar }: RevisarSugerenciaCompraProps) {
  const [filas, setFilas] = useState<Record<string, Fila>>(() =>
    Object.fromEntries(
      sugerencia.items.map((i) => [
        i.insumo_id,
        { incluido: Number(i.cantidad) > 0, cantidad: String(i.cantidad), proveedor_id: i.proveedor_id ?? '' },
      ]),
    ),
  )
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')

  function cambiar(insumoId: string, cambios: Partial<Fila>) {
    setFilas((prev) => ({ ...prev, [insumoId]: { ...prev[insumoId], ...cambios } }))
  }

  const marcados = sugerencia.items.filter((i) => filas[i.insumo_id].incluido)
  const invalidos = marcados.filter((i) => {
    const f = filas[i.insumo_id]
    return !(Number(f.cantidad) > 0) || !f.proveedor_id
  })
  const total = marcados.reduce((t, i) => t + Number(filas[i.insumo_id].cantidad || 0) * Number(i.costo_estimado ?? 0), 0)
  const proveedoresDistintos = new Set(marcados.map((i) => filas[i.insumo_id].proveedor_id).filter(Boolean)).size

  function aprobar() {
    onAprobar(
      marcados.map((i) => ({
        insumo_id: i.insumo_id,
        cantidad: Number(filas[i.insumo_id].cantidad),
        proveedor_id: filas[i.insumo_id].proveedor_id,
        costo_estimado: i.costo_estimado,
      })),
    )
  }

  return (
    <section className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-[18px]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[17px] font-extrabold">Sugerencia de compra para {sugerencia.dias} días</p>
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
              {['', 'Insumo', 'Situación', 'Comprar', 'Proveedor', 'Costo est.', 'Por qué'].map((c) => (
                <th key={c} className="whitespace-nowrap px-1 pb-2 font-bold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sugerencia.items.map((i) => {
              const f = filas[i.insumo_id]
              const subtotal = Number(f.cantidad || 0) * Number(i.costo_estimado ?? 0)
              return (
                <tr key={i.insumo_id} className={`border-b border-[var(--border)] align-top last:border-0 ${f.incluido ? '' : 'opacity-50'}`}>
                  <td className="px-1 py-2">
                    <input
                      type="checkbox"
                      checked={f.incluido}
                      onChange={(e) => cambiar(i.insumo_id, { incluido: e.target.checked })}
                      aria-label={`Comprar ${i.insumo}`}
                    />
                  </td>
                  <td className="px-1 py-2">
                    <div className="font-bold">{i.insumo}</div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-px text-[10.5px] font-bold uppercase ${ESTILO_PRIORIDAD[i.prioridad]}`}>
                      {i.prioridad}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-1 py-2 text-[var(--ink-soft)]">
                    <div>Hay {cantidad(i.stock, i.unidad)}</div>
                    <div>Usa {cantidad(i.consumo_diario, i.unidad)}/día</div>
                    {i.dias_alcanza != null && <div>Alcanza {Number(i.dias_alcanza).toLocaleString('es')} días</div>}
                    {Number(i.pedido_pendiente) > 0 && <div>Ya pedido: {cantidad(i.pedido_pendiente, i.unidad)}</div>}
                  </td>
                  <td className="whitespace-nowrap px-1 py-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={f.cantidad}
                      disabled={!f.incluido}
                      onChange={(e) => cambiar(i.insumo_id, { cantidad: e.target.value })}
                      className="w-[80px] rounded-lg border border-[var(--border)] px-2 py-1"
                    />{' '}
                    {i.unidad}
                    <div className="mt-0.5 text-[11px] text-[var(--ink-soft)]">Calculado: {cantidad(i.cantidad_base, i.unidad)}</div>
                  </td>
                  <td className="px-1 py-2">
                    <select
                      value={f.proveedor_id}
                      disabled={!f.incluido}
                      onChange={(e) => cambiar(i.insumo_id, { proveedor_id: e.target.value })}
                      className={`max-w-[170px] rounded-lg border px-2 py-1 ${
                        f.incluido && !f.proveedor_id ? 'border-[var(--red)]' : 'border-[var(--border)]'
                      }`}
                    >
                      <option value="">Elegir proveedor…</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-1 py-2">
                    {i.costo_estimado == null ? <span className="text-[var(--ink-soft)]">Sin precio</span> : formatearMoneda(subtotal)}
                  </td>
                  <td className="min-w-[180px] px-1 py-2 text-[var(--ink-soft)]">{i.motivo || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <p className="text-[13px]">
          <b>{marcados.length}</b> de {sugerencia.items.length} insumos · estimado <b>{formatearMoneda(total)}</b>
          {proveedoresDistintos > 0 && (
            <span className="text-[var(--ink-soft)]">
              {' '}
              · se {proveedoresDistintos === 1 ? 'crea 1 borrador' : `crean ${proveedoresDistintos} borradores`}
            </span>
          )}
          {invalidos.length > 0 && (
            <span className="block text-xs font-semibold text-[var(--red)]">
              Falta cantidad o proveedor en: {invalidos.map((i) => i.insumo).join(', ')}
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
              onClick={aprobar}
              disabled={guardando || marcados.length === 0 || invalidos.length > 0}
              className="rounded-full bg-[var(--orange)] px-5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Aprobar y crear borradores'}
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
            <button
              type="button"
              onClick={() => setRechazando(false)}
              className="rounded-full px-3 py-2 text-[13px] font-semibold text-[var(--ink-soft)]"
            >
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
