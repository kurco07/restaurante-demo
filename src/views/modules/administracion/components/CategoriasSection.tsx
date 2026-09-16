import { useState, type FormEvent } from 'react'
import type { CategoriaMenu } from '../../../../models/types'

interface CategoriasSectionProps {
  categorias: CategoriaMenu[]
  onCrear: (nombre: string, orden: number) => Promise<void>
}

export function CategoriasSection({ categorias, onCrear }: CategoriasSectionProps) {
  const [nombre, setNombre] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-semibold">Categorías</h2>

      <ul className="flex flex-wrap gap-2">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
          >
            {categoria.nombre}
          </li>
        ))}
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
