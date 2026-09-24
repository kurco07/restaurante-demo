import type { PlatoConExtras } from '../../../../models/types'
import { GRADIENTES_FOTO, FOTO_POR_DEFECTO } from './constants'

interface ModalPersonalizacionProps {
  plato: PlatoConExtras | null
  isOpen: boolean
  onClose: () => void
  proteinaSeleccionada: string | null
  onProteinaChange: (value: string | null) => void
  ingredientesQuitados: Set<string>
  onToggleQuitar: (ing: string) => void
  extrasSeleccionados: Set<string>
  onToggleExtra: (nombre: string) => void
  cantidad: number
  onCantidadChange: (value: number) => void
  notaItem: string
  onNotaItemChange: (value: string) => void
  onAgregar: () => void
  precioTotal: number
}

export function ModalPersonalizacion({
  plato,
  isOpen,
  onClose,
  proteinaSeleccionada,
  onProteinaChange,
  ingredientesQuitados,
  onToggleQuitar,
  extrasSeleccionados,
  onToggleExtra,
  cantidad,
  onCantidadChange,
  notaItem,
  onNotaItemChange,
  onAgregar,
  precioTotal,
}: ModalPersonalizacionProps) {
  if (!plato || !isOpen) return null

  const background = GRADIENTES_FOTO[plato.imagen_url?.split('/').pop()?.split('.')[0] || ''] || FOTO_POR_DEFECTO

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-[460px] max-h-[86vh] overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-[0_30px_70px_rgba(43,33,24,0.35)]">
        <div
          className="aspect-[3.5/1] rounded-t-2xl flex items-center justify-center"
          style={{ background }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.4" className="h-10 w-10">
            <circle cx="12" cy="12" r="8" />
          </svg>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 id="modal-title" className="font-baloo2 text-2xl font-extrabold text-[var(--ink)]">
                {plato.nombre}
              </h3>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{plato.descripcion}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)]"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {plato.proteina && (
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink)]">
                  Elige tu proteína
                </span>
                <span className="text-xs font-extrabold text-[var(--red)]">· obligatorio</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {plato.proteina.opciones.map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => onProteinaChange(op)}
                    className={`rounded-full px-4 py-2 text-sm font-extrabold transition-colors ${
                      proteinaSeleccionada === op
                        ? 'bg-[var(--orange)] border-[var(--orange)] text-white'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>
          )}

          {plato.quitar && plato.quitar.length > 0 && (
            <div className="mt-5">
              <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink)]">
                Quitar ingredientes
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {plato.quitar.map((ing) => {
                  const quitado = ingredientesQuitados.has(ing)
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => onToggleQuitar(ing)}
                      className={`rounded-full px-4 py-2 text-sm font-extrabold transition-colors ${
                        quitado
                          ? 'border-[var(--red)] bg-[var(--surface)] text-[var(--red)] line-through'
                          : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--ink)]'
                      }`}
                    >
                      {quitado ? '✕ ' : '✓ '}{ing}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {plato.extras && plato.extras.length > 0 && (
            <div className="mt-5">
              <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink)]">
                Extras
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {plato.extras.map((ex) => {
                  const activo = extrasSeleccionados.has(ex.nombre)
                  return (
                    <button
                      key={ex.nombre}
                      type="button"
                      onClick={() => onToggleExtra(ex.nombre)}
                      className={`rounded-full px-4 py-2 text-sm font-extrabold transition-colors ${
                        activo
                          ? 'border-[var(--orange)] bg-[var(--surface-alt)] text-[var(--orange-dark)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
                      }`}
                    >
                      {activo ? '✓ ' : '+ '}{ex.nombre} (${ex.precio.toFixed(2)})
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--ink)]">
              Cantidad
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onCantidadChange(Math.max(1, cantidad - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] text-xl font-extrabold text-[var(--orange-dark)]"
              >
                −
              </button>
              <span className="w-10 text-center text-xl font-extrabold tabular-nums">{cantidad}</span>
              <button
                type="button"
                onClick={() => onCantidadChange(cantidad + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] text-xl font-extrabold text-[var(--orange-dark)]"
              >
                +
              </button>
            </div>
          </div>

          <textarea
            placeholder="Nota para este plato (opcional)..."
            value={notaItem}
            onChange={(e) => onNotaItemChange(e.target.value)}
            rows={2}
            className="mt-4 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--orange)] resize-none font-inter"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-[var(--border)] bg-transparent py-3 text-base font-extrabold text-[var(--ink-soft)] hover:bg-[var(--surface-alt)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onAgregar}
              className="flex-1 rounded-xl bg-[var(--orange)] py-3 text-base font-extrabold text-white hover:bg-[var(--orange-dark)] transition-colors"
            >
              Agregar — ${precioTotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}