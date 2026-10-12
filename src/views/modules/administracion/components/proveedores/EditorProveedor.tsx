import { useState } from 'react'
import type { OrdenCompraConDetalle } from '../../../../../models/services/compraService'
import type { Proveedor } from '../../../../../models/types'

interface EditorProveedorProps {
  proveedor: Proveedor | null
  ordenes: OrdenCompraConDetalle[]
  creando: boolean
  guardando: boolean
  onCrear: (datos: { nombre: string; contacto: string }) => Promise<void>
  onGuardar: (id: string, datos: { nombre: string; contacto: string }) => Promise<void>
  onEliminar: (id: string) => Promise<void>
  onCancelar: () => void
}

const FORM_VACIO = { nombre: '', contacto: '' }

export function EditorProveedor({
  proveedor,
  ordenes,
  creando,
  guardando,
  onCrear,
  onGuardar,
  onEliminar,
  onCancelar,
}: EditorProveedorProps) {
  const [form, setForm] = useState(() =>
    proveedor ? { nombre: proveedor.nombre, contacto: proveedor.contacto ?? '' } : FORM_VACIO,
  )
  const [error, setError] = useState<string | null>(null)

  if (!proveedor && !creando) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--ink-soft)]">
        Selecciona un proveedor de la lista, o crea uno nuevo.
      </div>
    )
  }

  async function handleGuardar() {
    setError(null)
    try {
      if (creando) {
        await onCrear(form)
      } else if (proveedor) {
        await onGuardar(proveedor.id, form)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    }
  }

  async function handleEliminar() {
    if (!proveedor) return
    if (!confirm(`¿Eliminar "${proveedor.nombre}"? Esto falla si tiene órdenes de compra asociadas.`)) return
    setError(null)
    try {
      await onEliminar(proveedor.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el proveedor.')
    }
  }

  return (
    <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="mb-4 text-base font-extrabold">{creando ? 'Nuevo proveedor' : 'Editor de proveedor'}</p>

      <div className="flex flex-col gap-3 text-[13px]">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Nombre</span>
          <input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Contacto</span>
          <textarea
            placeholder="Teléfono, correo, nombre de contacto..."
            rows={2}
            value={form.contacto}
            onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
        </label>

        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || !form.nombre.trim()}
            className="flex-1 rounded-lg bg-[var(--orange)] py-2.5 font-bold text-white disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : creando ? 'Crear proveedor' : 'Guardar cambios'}
          </button>
          {creando ? (
            <button type="button" onClick={onCancelar} className="rounded-lg px-3 font-bold text-[var(--ink-soft)]">
              Cancelar
            </button>
          ) : (
            <button type="button" onClick={handleEliminar} className="rounded-lg px-3 font-bold text-[var(--red)]">
              Eliminar
            </button>
          )}
        </div>

        {error && <p className="text-[var(--red)]">{error}</p>}
      </div>

      {!creando && proveedor && (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <p className="mb-2 text-[13px] font-bold">
            {ordenes.length} {ordenes.length === 1 ? 'orden de compra' : 'órdenes de compra'}
          </p>
          {ordenes.length === 0 ? (
            <p className="text-xs text-[var(--ink-soft)]">Todavía no se le ha hecho ninguna orden.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {ordenes.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-[10px] bg-[var(--surface-alt)] px-3 py-2 text-[12px]"
                >
                  <span className="font-bold">{o.codigo}</span>
                  <span className="text-[var(--ink-soft)]">{o.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
