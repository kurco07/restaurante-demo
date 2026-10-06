import { CATEGORIA_FAVORITOS } from '../../../../controllers/pedido/usePedidos'

interface CategoriaPillsProps {
  categorias: { id: string; nombre: string }[]
  categoriaActiva: string
  onCambiarCategoria: (cat: string) => void
}

export function CategoriaPills({ categorias, categoriaActiva, onCambiarCategoria }: CategoriaPillsProps) {
  const pills = [{ id: CATEGORIA_FAVORITOS, nombre: 'Favoritos' }, ...categorias]

  return (
    <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Categorías del menú">
      {pills.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={categoriaActiva === cat.id}
          onClick={() => onCambiarCategoria(cat.id)}
          className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
            categoriaActiva === cat.id
              ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)] hover:border-[var(--orange)] hover:text-[var(--orange)]'
          }`}
        >
          {cat.nombre}
        </button>
      ))}
    </div>
  )
}
