import { useState, type FormEvent } from 'react'
import type { CategoriaMenu } from '../../../../models/types'

interface CategoriasSectionProps {
  categorias: CategoriaMenu[]
  onCrear: (nombre: string, orden: number) => Promise<void>
  onActualizar: (id: string, nombre: string) => Promise<void>
  onEliminar: (id: string) => Promise<void>
}

export function CategoriasSection({
  categorias,
  onCrear,
  onActualizar,
  onEliminar,
}: CategoriasSectionProps) {
  const [nombre, setNombre] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onCrear(nombre.trim(), categorias.length)
      setNombre('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la categoría.')
    } finally {
      setSubmitting(false)
    }
  }

  function empezarEdicion(categoria: CategoriaMenu) {
    setEditandoId(categoria.id)
    setNombreEditado(categoria.nombre)
    setError(null)
  }

  async function guardarEdicion(id: string) {
    setError(null)
    try {
      await onActualizar(id, nombreEditado.trim())
      setEditandoId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la categoría.')
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return
    setError(null)
    try {
      await onEliminar(id)
    } catch (err) {
      setError(
        err instanceof Error
          ? `No se pudo eliminar: ${err.message}`
          : 'No se pudo eliminar la categoría.',
      )
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-semibold">Categorías</h2>

      <ul className="flex flex-wrap gap-2">
        {categorias.map((categoria) =>
          editandoId === categoria.id ? (
            <li key={categoria.id} className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={nombreEditado}
                onChange={(event) => setNombreEditado(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') guardarEdicion(categoria.id)
                  if (event.key === 'Escape') setEditandoId(null)
                }}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => guardarEdicion(categoria.id)}
                className="text-xs text-blue-600 hover:underline"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditandoId(null)}
                className="text-xs text-gray-500 hover:underline"
              >
                Cancelar
              </button>
            </li>
          ) : (
            <li
              key={categoria.id}
              className="group flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
            >
              {categoria.nombre}
              <button
                type="button"
                onClick={() => empezarEdicion(categoria)}
                className="text-xs text-gray-400 hover:text-blue-600"
                title="Editar"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => handleEliminar(categoria.id)}
                className="text-xs text-gray-400 hover:text-red-600"
                title="Eliminar"
              >
                ×
              </button>
            </li>
          ),
        )}
        {categorias.length === 0 && (
          <li className="text-sm text-gray-500">Todavía no hay categorías.</li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Nombre de la categoría (ej. Entradas)"
          required
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? 'Agregando…' : 'Agregar'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
