import type { ItemCarrito } from '../../../../models/types'

interface ResumenPedidoProps {
  carrito: ItemCarrito[]
  mesaNumero: number
  notaGeneral: string
  onNotaGeneralChange: (value: string) => void
  onActualizarCantidad: (id: string, delta: number) => void
  onEliminar: (id: string) => void
  onEnviarACocina: () => void
  onGuardarBorrador: () => void
  subtotal: number
}

export function ResumenPedido({
  carrito,
  mesaNumero,
  notaGeneral,
  onNotaGeneralChange,
  onActualizarCantidad,
  onEliminar,
  onEnviarACocina,
  onGuardarBorrador,
  subtotal,
}: ResumenPedidoProps) {
  return (
    <aside className="flex flex-col gap-4" aria-label="Resumen del pedido">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-alt)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-[var(--orange-dark)]">
              <path d="M6 2l1.5 20h9L18 2M4 7h16" />
            </svg>
          </div>
          <h2 className="font-baloo2 text-2xl font-extrabold text-[var(--ink)]">Pedido #048</h2>
        </div>
        <p className="ml-13 mb-4 text-sm text-[var(--ink-soft)]">{carrito.length} ítems · Mesa {mesaNumero}</p>

        <div id="cart-list" className="divide-y divide-[var(--border)]">
          {carrito.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--ink-soft)]">Pedido vacío</p>
          ) : (
            carrito.map((item) => (
              <div key={item.id} className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--ink)]">{item.cantidad}× {item.nombre}</span>
                    </div>
                    {item.proteinaSeleccionada && (
                      <p className="mt-0.5 text-sm font-semibold text-[var(--orange-dark)]">{item.proteinaSeleccionada}</p>
                    )}
                    {item.ingredientesQuitados.length > 0 && (
                      <p className="mt-0.5 text-sm font-semibold text-[var(--orange-dark)]">
                        {item.ingredientesQuitados.map((i) => `Sin ${i}`).join(' · ')}
                      </p>
                    )}
                    {item.extras.length > 0 && (
                      <p className="mt-0.5 text-sm font-semibold text-[var(--orange-dark)]">
                        {item.extras.map((e) => `+${e.nombre}`).join(' · ')}
                      </p>
                    )}
                    {item.nota && <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{item.nota}</p>}
                    <p className="mt-0.5 text-[11px] text-[var(--ink-soft)]">{item.agregadoPor}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-[var(--ink)]">
                      ${item.precioTotal.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)]">
                      <button
                        type="button"
                        onClick={() => onActualizarCantidad(item.id, -1)}
                        className="flex h-8 w-8 items-center justify-center text-base font-extrabold text-[var(--orange-dark)]"
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="px-2 text-sm font-extrabold tabular-nums">{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => onActualizarCantidad(item.id, 1)}
                        className="flex h-8 w-8 items-center justify-center text-base font-extrabold text-[var(--orange-dark)]"
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEliminar(item.id)}
                      className="text-[var(--ink-soft)] opacity-60 hover:opacity-100"
                      aria-label="Eliminar item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <textarea
            placeholder="📝 Nota general para cocina (ej. cliente con prisa, celebrando cumpleaños...)"
            value={notaGeneral}
            onChange={(e) => onNotaGeneralChange(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--orange)] resize-none font-inter"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-[var(--ink-soft)]">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-extrabold text-[var(--ink)]">
            <span>Total</span>
            <span className="text-[var(--orange-dark)]">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onGuardarBorrador}
            className="flex-1 rounded-xl border-2 border-[var(--border)] bg-transparent py-3 text-base font-extrabold text-[var(--ink-soft)] hover:bg-[var(--surface-alt)] transition-colors"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={onEnviarACocina}
            disabled={carrito.length === 0}
            className="flex-1.4 rounded-xl bg-[var(--orange)] py-3 text-base font-extrabold text-white hover:bg-[var(--orange-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar a cocina →
          </button>
        </div>
      </div>
    </aside>
  )
}