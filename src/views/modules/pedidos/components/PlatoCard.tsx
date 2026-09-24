import type { PlatoConExtras } from '../../../../models/types'
import { GRADIENTES_FOTO, FOTO_POR_DEFECTO } from './constants'

interface PlatoCardProps {
  plato: PlatoConExtras
  onClick: () => void
}

export function PlatoCard({ plato, onClick }: PlatoCardProps) {
  const background = GRADIENTES_FOTO[plato.imagen_url?.split('/').pop()?.split('.')[0] || ''] || FOTO_POR_DEFECTO

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
      onClick={onClick}
    >
      <div
        className="aspect-[4/3] flex items-center justify-center"
        style={{ background }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.3" className="h-12 w-12">
          <circle cx="12" cy="12" r="8" />
        </svg>
      </div>
      <div className="p-3">
        <h3 className="mb-1 text-base font-extrabold text-[var(--ink)]">{plato.nombre}</h3>
        <p className="mb-2 text-sm text-[var(--ink-soft)] line-clamp-2">{plato.descripcion}</p>
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-[var(--orange-dark)]">
            ${plato.precio_base.toFixed(2)}
          </span>
          <button
            type="button"
            className="rounded-full bg-[var(--orange)] px-4 py-1.5 text-xs font-extrabold text-white hover:bg-[var(--orange-dark)] transition-colors"
          >
            Personalizar
          </button>
        </div>
      </div>
    </article>
  )
}