import { useState, type FormEvent } from 'react'
import type { CategoriaMenu, Insumo, MenuItem, Receta } from '../../../../models/types'
import { RecetaEditor } from './RecetaEditor'
import { DisponibilidadSede } from './DisponibilidadSede'
import { mensajeDeError } from '../../../../lib/errores'

interface DatosPlato {
  categoria_id: string
  nombre: string
  descripcion?: string
  precio_base: number
}

interface PlatoDetallePanelProps {
  categorias: CategoriaMenu[]
  plato: MenuItem | null
  creando: boolean
  onGuardar: (datos: DatosPlato) => Promise<void>
  onCancelar: () => void
  onEliminar: (id: string) => Promise<void>
  receta: Receta[]
  insumos: Insumo[]
  onAgregarRecetaLinea: (linea: {
    insumoId?: string
    insumoNuevo?: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] }
    cantidadRequerida: number
    unidad: string
  }) => Promise<void>
  onEliminarRecetaLinea: (recetaId: string) => Promise<void>
}

const FORM_VACIO = { categoriaId: '', nombre: '', descripcion: '', precio: '' }

export function PlatoDetallePanel({
  categorias,
  plato,
  creando,
  onGuardar,
  onCancelar,
  onEliminar,
  receta,
  insumos,
  onAgregarRecetaLinea,
  onEliminarRecetaLinea,
}: PlatoDetallePanelProps) {
  // El padre remonta este componente (key={seleccionadoId ?? 'nuevo'}) cada
  // vez que cambia el plato editado, así que el estado inicial basta — no
  // hace falta sincronizarlo con un efecto.
  const [form, setForm] = useState(() =>
    plato
      ? {
          categoriaId: plato.categoria_id,
          nombre: plato.nombre,
          descripcion: plato.descripcion ?? '',
          precio: String(plato.precio_base),
        }
      : FORM_VACIO,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)

  if (!plato && !creando) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--ink-soft)]">
        Selecciona un plato de la lista, o crea uno nuevo.
      </div>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!form.categoriaId) {
      setError('Selecciona una categoría.')
      return
    }

    setSubmitting(true)
    try {
      await onGuardar({
        categoria_id: form.categoriaId,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        precio_base: Number(form.precio),
      })
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el plato.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEliminar() {
    if (!plato) return
    if (eliminando || !confirm('¿Eliminar este plato?')) return
    setError(null)
    setEliminando(true)
    try {
      await onEliminar(plato.id)
    } catch (err) {
      // Lo más común: ya tiene pedidos, y la base no deja borrarlo
      setError(
        mensajeDeError(err, 'No se pudo eliminar el plato.', {
          enUso: 'No se puede eliminar: este plato ya tiene pedidos registrados y se necesitan para los reportes. Si ya no lo vendes, desmarca «Disponible» aquí abajo y deja de verse en el menú.',
        }),
      )
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="mb-4 text-base font-extrabold">{creando ? 'Nuevo plato' : 'Editar plato'}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-[13px]">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Categoría</span>
          <select
            value={form.categoriaId}
            onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          >
            <option value="">Selecciona…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Nombre</span>
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Descripción</span>
          <input
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Precio</span>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={form.precio}
            onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
            className="w-28 rounded-lg border border-[var(--border)] px-3 py-2"
          />
        </label>

        <div className="mt-1 flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-[var(--orange)] py-2.5 font-bold text-white disabled:opacity-50"
          >
            {submitting ? 'Guardando…' : creando ? 'Crear plato' : 'Guardar cambios'}
          </button>
          {creando ? (
            <button type="button" onClick={onCancelar} className="rounded-lg px-3 font-bold text-[var(--ink-soft)]">
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEliminar}
              disabled={eliminando}
              className="rounded-lg px-3 font-bold text-[var(--red)] disabled:opacity-50"
            >
              {eliminando ? 'Eliminando…' : 'Eliminar'}
            </button>
          )}
        </div>

        {error && <p className="text-[var(--red)]">{error}</p>}
      </form>

      {!creando && plato && (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <DisponibilidadSede menuItemId={plato.id} precioBase={plato.precio_base} />
        </div>
      )}

      {!creando && plato && (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <RecetaEditor
            receta={receta}
            insumos={insumos}
            onAgregarLinea={onAgregarRecetaLinea}
            onEliminarLinea={onEliminarRecetaLinea}
          />
        </div>
      )}
    </div>
  )
}
