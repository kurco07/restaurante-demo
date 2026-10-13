import { useState } from 'react'
import type { OrdenCompraConDetalle, ItemOrdenCompraDetalle } from '../../../../../models/services/compraService'
import { totalOrden, type ItemFormulario } from '../../../../../controllers/administracion/useCompras'
import type { Insumo, Proveedor } from '../../../../../models/types'
import { formatearMoneda } from '../../../../components/ui/constants'
import { Campo, FilaCampos, NotaInfo, PanelLateral } from '../comunes'

interface FilaItem {
  insumo_id: string
  cantidad: string
  costo_estimado: string
}

interface DetalleOrdenPanelProps {
  orden: OrdenCompraConDetalle | null
  creando: boolean
  guardando: boolean
  proveedores: Proveedor[]
  insumos: Insumo[]
  onCrear: (datos: { proveedor_id: string; items: ItemFormulario[] }) => Promise<void>
  onGuardarItems: (ordenId: string, items: ItemFormulario[]) => Promise<void>
  onAprobar: (ordenId: string) => Promise<void>
  onDescartar: (ordenId: string) => Promise<void>
  onRecibir: (orden: OrdenCompraConDetalle, fechasVencimiento: Record<string, string | null>) => Promise<void>
  onCancelar: () => void
}

function filaVacia(): FilaItem {
  return { insumo_id: '', cantidad: '', costo_estimado: '' }
}

function itemsAFormulario(items: ItemOrdenCompraDetalle[]): FilaItem[] {
  return items.map((i) => ({
    insumo_id: i.insumo_id,
    cantidad: String(i.cantidad),
    costo_estimado: i.costo_estimado !== null ? String(i.costo_estimado) : '',
  }))
}

function filasValidas(filas: FilaItem[]): ItemFormulario[] | null {
  const items = filas
    .filter((f) => f.insumo_id && f.cantidad)
    .map((f) => ({
      insumo_id: f.insumo_id,
      cantidad: Number(f.cantidad),
      costo_estimado: f.costo_estimado.trim() === '' ? null : Number(f.costo_estimado),
    }))
  if (items.length === 0) return null
  if (items.some((i) => !Number.isFinite(i.cantidad) || i.cantidad <= 0)) return null
  return items
}

export function DetalleOrdenPanel({
  orden,
  creando,
  guardando,
  proveedores,
  insumos,
  onCrear,
  onGuardarItems,
  onAprobar,
  onDescartar,
  onRecibir,
  onCancelar,
}: DetalleOrdenPanelProps) {
  const [proveedorId, setProveedorId] = useState(orden?.proveedor_id ?? '')
  const [filas, setFilas] = useState<FilaItem[]>(orden ? itemsAFormulario(orden.items) : [filaVacia()])
  const [recibiendo, setRecibiendo] = useState(false)
  const [fechasVencimiento, setFechasVencimiento] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  if (!orden && !creando) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--ink-soft)]">
        Selecciona una orden de la lista, o crea una nueva.
      </div>
    )
  }

  const editable = creando || orden?.estado === 'borrador'

  function actualizarFila(i: number, cambios: Partial<FilaItem>) {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...cambios } : f)))
  }

  function quitarFila(i: number) {
    setFilas((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleGuardar() {
    setError(null)
    const items = filasValidas(filas)
    if (!items) {
      setError('Agrega al menos un insumo con cantidad válida.')
      return
    }
    try {
      if (creando) {
        if (!proveedorId) {
          setError('Selecciona un proveedor.')
          return
        }
        await onCrear({ proveedor_id: proveedorId, items })
      } else if (orden) {
        await onGuardarItems(orden.id, items)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la orden.')
    }
  }

  async function handleDescartar() {
    if (!orden) return
    if (!confirm(`¿Descartar el borrador ${orden.codigo}? No se puede recuperar.`)) return
    await onDescartar(orden.id)
  }

  async function handleAprobar() {
    if (!orden) return
    await onAprobar(orden.id)
  }

  const itemsPorLote = orden?.items.filter((i) => i.tipo === 'por_lote') ?? []

  async function handleConfirmarRecepcion() {
    if (!orden) return
    setError(null)
    try {
      await onRecibir(
        orden,
        Object.fromEntries(itemsPorLote.map((i) => [i.insumo_id, fechasVencimiento[i.insumo_id] || null])),
      )
      setRecibiendo(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la recepción.')
    }
  }

  return (
    <PanelLateral
      titulo={creando ? 'Nueva orden de compra' : `Orden ${orden!.codigo}`}
      subtitulo={creando ? 'Borrador — se puede editar antes de aprobar' : `${orden!.proveedor} · Solicitada por ${orden!.solicitadaPor}`}
    >
      {!creando && orden && (
        <div className="mb-4">
          <EstadoBadge estado={orden.estado} />
        </div>
      )}

      {creando && (
        <label className="mb-3 flex flex-col gap-1 text-[13px]">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Proveedor</span>
          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          >
            <option value="">Seleccionar proveedor…</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
      )}

      {editable ? (
        <div className="flex flex-col gap-2">
          {filas.map((fila, i) => (
            <div key={i} className="flex items-end gap-1.5">
              <select
                value={fila.insumo_id}
                onChange={(e) => actualizarFila(i, { insumo_id: e.target.value })}
                className="flex-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-[12.5px]"
              >
                <option value="">Insumo…</option>
                {insumos.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0.001"
                step="0.001"
                placeholder="Cant."
                value={fila.cantidad}
                onChange={(e) => actualizarFila(i, { cantidad: e.target.value })}
                className="w-20 rounded-lg border border-[var(--border)] px-2 py-1.5 text-[12.5px]"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Costo c/u"
                value={fila.costo_estimado}
                onChange={(e) => actualizarFila(i, { costo_estimado: e.target.value })}
                className="w-24 rounded-lg border border-[var(--border)] px-2 py-1.5 text-[12.5px]"
              />
              <button type="button" onClick={() => quitarFila(i)} className="px-1.5 text-[var(--red)]">
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFilas((prev) => [...prev, filaVacia()])}
            className="self-start text-[12px] font-bold text-[var(--orange-dark)]"
          >
            + Agregar insumo
          </button>

          {error && <p className="text-[13px] text-[var(--red)]">{error}</p>}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 rounded-lg bg-[var(--orange)] py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : creando ? 'Crear borrador' : 'Guardar cambios'}
            </button>
            {creando ? (
              <button type="button" onClick={onCancelar} className="rounded-lg px-3 text-[13px] font-bold text-[var(--ink-soft)]">
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDescartar}
                disabled={guardando}
                className="rounded-lg px-3 text-[13px] font-bold text-[var(--red)]"
              >
                Descartar
              </button>
            )}
          </div>

          {!creando && orden && (
            <button
              type="button"
              onClick={handleAprobar}
              disabled={guardando}
              className="mt-1 w-full rounded-xl bg-[var(--green)] p-3 text-[13.5px] font-bold text-white disabled:opacity-50"
            >
              ✓ Aprobar orden
            </button>
          )}
        </div>
      ) : (
        orden && (
          <>
            <FilaCampos>
              <Campo label="Fecha de solicitud" apagado>
                {new Date(orden.creado_en).toLocaleDateString('es-VE')}
              </Campo>
              <Campo label="Estado" apagado>
                {orden.estado}
              </Campo>
            </FilaCampos>

            <div className="divide-y divide-[var(--border)]">
              {orden.items.map((item) => (
                <div key={item.insumo_id} className="flex justify-between gap-2 py-[9px] text-[12.5px]">
                  <span className="font-semibold">{item.insumo}</span>
                  <span className="text-[var(--ink-soft)]">
                    {item.cantidad} {item.unidad} × {formatearMoneda(item.costo_estimado ?? 0)}
                  </span>
                  <span className="font-bold">{formatearMoneda(item.cantidad * (item.costo_estimado ?? 0))}</span>
                </div>
              ))}
            </div>

            <div className="mt-1 flex justify-between border-t border-[var(--border)] pt-3 text-base font-bold">
              <span>Total de la orden</span>
              <span className="text-[var(--orange-dark)]">{formatearMoneda(totalOrden(orden))}</span>
            </div>

            {error && <p className="mt-2 text-[13px] text-[var(--red)]">{error}</p>}

            {orden.estado === 'aprobada' && !recibiendo && (
              <BotonGuardarClick
                disabled={guardando}
                onClick={() => (itemsPorLote.length > 0 ? setRecibiendo(true) : handleConfirmarRecepcion())}
              >
                Registrar recepción
              </BotonGuardarClick>
            )}

            {orden.estado === 'aprobada' && recibiendo && (
              <div className="mt-3.5">
                <p className="mb-2 text-[12.5px] font-bold">
                  Fecha de vencimiento de los lotes recibidos (opcional)
                </p>
                <div className="flex flex-col gap-2">
                  {itemsPorLote.map((item) => (
                    <label key={item.insumo_id} className="flex items-center justify-between gap-2 text-[12.5px]">
                      <span className="font-semibold">{item.insumo}</span>
                      <input
                        type="date"
                        value={fechasVencimiento[item.insumo_id] ?? ''}
                        onChange={(e) =>
                          setFechasVencimiento((prev) => ({ ...prev, [item.insumo_id]: e.target.value }))
                        }
                        className="rounded-lg border border-[var(--border)] px-2 py-1.5"
                      />
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleConfirmarRecepcion}
                  disabled={guardando}
                  className="mt-3 w-full rounded-xl bg-[var(--green)] p-3 text-[13.5px] font-bold text-white disabled:opacity-50"
                >
                  Confirmar recepción
                </button>
              </div>
            )}

            {orden.estado === 'recibida' && (
              <div className="mt-3.5">
                <NotaInfo>Mercancía recibida — el stock ya se sumó a inventario.</NotaInfo>
              </div>
            )}
          </>
        )
      )}
    </PanelLateral>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
      {estado}
    </span>
  )
}

function BotonGuardarClick({
  children,
  onClick,
  disabled,
}: {
  children: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3.5 w-full rounded-xl bg-[var(--orange)] p-3.5 text-center text-sm font-bold text-white disabled:opacity-50"
    >
      {children}
    </button>
  )
}
