import { useState, type FormEvent } from 'react'
import type { CategoriaMenu, Insumo, MenuItem, Receta } from '../../../../models/types'
import { RecetaEditor } from './RecetaEditor'

interface MenuItemsSectionProps {
  categorias: CategoriaMenu[]
  menuItems: MenuItem[]
  insumos: Insumo[]
  recetaPorItem: Record<string, Receta[]>
  itemExpandido: string | null
  onCrearItem: (item: {
    categoria_id: string
    nombre: string
    descripcion?: string
    precio_base: number
  }) => Promise<void>
  onActualizarItem: (
    id: string,
    cambios: { categoria_id: string; nombre: string; descripcion?: string; precio_base: number },
  ) => Promise<void>
  onEliminarItem: (id: string) => Promise<void>
  onToggleReceta: (menuItemId: string) => void
  onAgregarRecetaLinea: (
    menuItemId: string,
    linea: {
      insumoId?: string
      insumoNuevo?: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] }
      cantidadRequerida: number
      unidad: string
    },
  ) => Promise<void>
  onEliminarRecetaLinea: (menuItemId: string, recetaId: string) => Promise<void>
}

const FORM_VACIO = { categoriaId: '', nombre: '', descripcion: '', precio: '' }

export function MenuItemsSection({
  categorias,
  menuItems,
  insumos,
  recetaPorItem,
  itemExpandido,
  onCrearItem,
  onActualizarItem,
  onEliminarItem,
  onToggleReceta,
  onAgregarRecetaLinea,
  onEliminarRecetaLinea,
}: MenuItemsSectionProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function nombreCategoria(id: string) {
    return categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría'
  }

  function empezarEdicion(item: MenuItem) {
    setEditandoId(item.id)
    setForm({
      categoriaId: item.categoria_id,
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      precio: String(item.precio_base),
    })
    setError(null)
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setForm(FORM_VACIO)
    setError(null)
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar este plato?')) return
    setError(null)
    try {
      await onEliminarItem(id)
      if (editandoId === id) cancelarEdicion()
    } catch (err) {
      setError(
        err instanceof Error ? `No se pudo eliminar: ${err.message}` : 'No se pudo eliminar el plato.',
      )
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!form.categoriaId) {
      setError('Selecciona una categoría (créala arriba si todavía no existe).')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        categoria_id: form.categoriaId,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        precio_base: Number(form.precio),
      }
      if (editandoId) {
        await onActualizarItem(editandoId, payload)
      } else {
        await onCrearItem(payload)
      }
      cancelarEdicion()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `No se pudo ${editandoId ? 'actualizar' : 'crear'} el plato.`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3.5 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-extrabold text-gray-900">Platos</h2>

      <ul className="flex flex-col gap-3">
        {menuItems.map((item) => (
          <li key={item.id} className="rounded-2xl border border-gray-200 p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-gray-900">{item.nombre}</p>
                <p className="text-xs text-gray-500">
                  {nombreCategoria(item.categoria_id)} · <span className="font-bold text-orange-600">${item.precio_base.toFixed(2)}</span>
                </p>
                {item.descripcion && <p className="mt-1.5 text-sm text-gray-600">{item.descripcion}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onToggleReceta(item.id)}
                  className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600 transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
                >
                  {itemExpandido === item.id ? 'Ocultar' : '📖 Receta'}
                </button>
                <button
                  type="button"
                  onClick={() => empezarEdicion(item)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleEliminar(item.id)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {itemExpandido === item.id && (
              <div className="mt-3.5">
                <RecetaEditor
                  receta={recetaPorItem[item.id] ?? []}
                  insumos={insumos}
                  onAgregarLinea={(linea) => onAgregarRecetaLinea(item.id, linea)}
                  onEliminarLinea={(recetaId) => onEliminarRecetaLinea(item.id, recetaId)}
                />
              </div>
            )}
          </li>
        ))}
        {menuItems.length === 0 && (
          <li className="text-sm text-gray-500">Todavía no hay platos en el menú.</li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2.5 border-t border-gray-100 pt-3.5">
        {editandoId && (
          <p className="w-full text-xs font-bold text-orange-600">Editando "{form.nombre}"</p>
        )}

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Categoría
          <select
            value={form.categoriaId}
            onChange={(event) => setForm((f) => ({ ...f, categoriaId: event.target.value }))}
            className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
          >
            <option value="">Selecciona…</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Nombre del plato
          <input
            type="text"
            required
            value={form.nombre}
            onChange={(event) => setForm((f) => ({ ...f, nombre: event.target.value }))}
            className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Descripción
          <input
            type="text"
            value={form.descripcion}
            onChange={(event) => setForm((f) => ({ ...f, descripcion: event.target.value }))}
            className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Precio
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.precio}
            onChange={(event) => setForm((f) => ({ ...f, precio: event.target.value }))}
            className="w-24 rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Agregar plato'}
        </button>

        {editandoId && (
          <button
            type="button"
            onClick={cancelarEdicion}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600"
          >
            Cancelar
          </button>
        )}
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
