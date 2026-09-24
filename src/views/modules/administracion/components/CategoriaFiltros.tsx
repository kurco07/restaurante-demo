import { useState, type FormEvent } from 'react'
import type { CategoriaMenu } from '../../../../models/types'

interface CategoriaFiltrosProps {
  categorias: CategoriaMenu[]
  activa: string
  onSeleccionar: (id: string) => void
  onCrear: (nombre: string, orden: number) => Promise<void>
  onActualizar: (id: string, nombre: string) => Promise<void>
  onEliminar: (id: string) => Promise<void>
}

// Las categorías son a la vez el filtro de la lista de platos y el punto
// de gestión (crear/renombrar/eliminar) — antes eran dos cosas separadas.
export function CategoriaFiltros({
  categorias,
  activa,
  onSeleccionar,
  onCrear,
  onActualizar,
  onEliminar,
}: CategoriaFiltrosProps) {
  const [agregando, setAgregando] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCrear(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await onCrear(nombreNuevo.trim(), categorias.length)
      setNombreNuevo('')
      setAgregando(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la categoría.')
    }
  }

  function empezarEdicion(categoria: CategoriaMenu) {
    setEditandoId(categoria.id)
    setNombreEditado(categoria.nombre)
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
    if (!confirm('¿Eliminar esta categoría? Solo se puede si no tiene platos.')) return
    setError(null)
    try {
      await onEliminar(id)
    } catch (err) {
      setError(err instanceof Error ? `No se pudo eliminar: ${err.message}` : 'No se pudo eliminar la categoría.')
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSeleccionar('todas')}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
            activa === 'todas'
              ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
              : 'border-[var(--border)] text-[var(--ink-soft)]'
          }`}
        >
          Todas
        </button>

        {categorias.map((categoria) =>
          editandoId === categoria.id ? (
            <span key={categoria.id} className="flex items-center gap-1">
              <input
                autoFocus
                value={nombreEditado}
                onChange={(e) => setNombreEditado(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarEdicion(categoria.id)
                  if (e.key === 'Escape') setEditandoId(null)
                }}
                className="w-28 rounded-full border border-[var(--orange)] px-3 py-1.5 text-xs"
              />
              <button type="button" onClick={() => guardarEdicion(categoria.id)} className="text-xs font-bold text-[var(--orange-dark)]">
                ✓
              </button>
              <button type="button" onClick={() => setEditandoId(null)} className="text-xs font-bold text-[var(--ink-soft)]">
                ✕
              </button>
            </span>
          ) : (
            <div
              key={categoria.id}
              className={`group flex items-center rounded-full border py-1.5 pl-3.5 pr-1.5 text-xs font-bold ${
                activa === categoria.id
                  ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                  : 'border-[var(--border)] text-[var(--ink-soft)] hover:border-[var(--orange)]'
              }`}
            >
              <button type="button" onClick={() => onSeleccionar(categoria.id)}>
                {categoria.nombre}
              </button>
              <button
                type="button"
                onClick={() => empezarEdicion(categoria)}
                title="Renombrar"
                className={`ml-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] opacity-0 group-hover:opacity-100 ${
                  activa === categoria.id ? 'hover:bg-white/20' : 'hover:bg-[var(--surface-alt)]'
                }`}
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => handleEliminar(categoria.id)}
                title="Eliminar"
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[11px] opacity-0 group-hover:opacity-100 ${
                  activa === categoria.id ? 'hover:bg-white/20' : 'hover:bg-[var(--surface-alt)]'
                }`}
              >
                ×
              </button>
            </div>
          ),
        )}

        {agregando ? (
          <form onSubmit={handleCrear} className="flex items-center gap-1">
            <input
              autoFocus
              placeholder="Nombre..."
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setAgregando(false)}
              className="w-32 rounded-full border border-[var(--orange)] px-3 py-1.5 text-xs"
            />
            <button type="submit" className="text-xs font-bold text-[var(--orange-dark)]">
              Agregar
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAgregando(true)}
            className="rounded-full border border-dashed border-[var(--border)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink-soft)] hover:border-[var(--orange)] hover:text-[var(--orange-dark)]"
          >
            + Categoría
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-[var(--red)]">{error}</p>}
    </div>
  )
}
