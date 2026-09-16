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

export function MenuItemsSection({
  categorias,
  menuItems,
  insumos,
  recetaPorItem,
  itemExpandido,
  onCrearItem,
  onToggleReceta,
  onAgregarRecetaLinea,
  onEliminarRecetaLinea,
}: MenuItemsSectionProps) {
  const [categoriaId, setCategoriaId] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function nombreCategoria(id: string) {
    return categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría'
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!categoriaId) {
      setError('Selecciona una categoría (créala arriba si todavía no existe).')
      return
    }

    setSubmitting(true)
    try {
      await onCrearItem({
        categoria_id: categoriaId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio_base: Number(precio),
      })
      setNombre('')
      setDescripcion('')
      setPrecio('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el plato.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-semibold">Platos</h2>

      <ul className="flex flex-col gap-3">
        {menuItems.map((item) => (
          <li key={item.id} className="rounded border border-gray-100 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.nombre}</p>
                <p className="text-xs text-gray-500">
                  {nombreCategoria(item.categoria_id)} · ${item.precio_base.toFixed(2)}
                </p>
                {item.descripcion && <p className="mt-1 text-sm text-gray-600">{item.descripcion}</p>}
              </div>
              <button
                type="button"
                onClick={() => onToggleReceta(item.id)}
                className="text-sm text-blue-600 hover:underline"
              >
                {itemExpandido === item.id ? 'Ocultar receta' : 'Receta'}
              </button>
            </div>

            {itemExpandido === item.id && (
              <div className="mt-3">
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

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Categoría
          <select
            value={categoriaId}
            onChange={(event) => setCategoriaId(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">Selecciona…</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Nombre del plato
          <input
            type="text"
            required
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Descripción
          <input
            type="text"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Precio
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={precio}
            onChange={(event) => setPrecio(event.target.value)}
            className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? 'Agregando…' : 'Agregar plato'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
