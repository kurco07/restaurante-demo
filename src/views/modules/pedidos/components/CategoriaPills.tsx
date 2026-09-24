import { CATEGORIAS_FIJAS } from './constants'

interface CategoriaPillsProps {
  categoriaActiva: string
  onCambiarCategoria: (cat: string) => void
}

export function CategoriaPills({ categoriaActiva, onCambiarCategoria }: CategoriaPillsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Categorías del menú">
      {CATEGORIAS_FIJAS.map((cat) => (
        <button
          key={cat}
          role="tab"
          aria-selected={categoriaActiva === cat}
          onClick={() => onCambiarCategoria(cat)}
          className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
            categoriaActiva === cat
              ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)] hover:border-[var(--orange)] hover:text-[var(--orange)]'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}