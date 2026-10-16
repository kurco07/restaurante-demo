import type { ItemCarrito } from '../../../../models/types'

export interface ItemEnviado {
  id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  notas: string | null
  estado: string
  porQr: boolean
}

const ETIQUETA_ESTADO_ITEM: Record<string, string> = {
  por_aprobar: 'Por aprobar',
  pendiente: 'En cocina',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  anulado: 'Anulado',
}

// Lo que el supervisor puede anular: ya en cocina y todavía no entregado
const ESTADOS_ANULABLES = new Set(['pendiente', 'en_preparacion', 'listo'])

interface ResumenPedidoProps {
  carrito: ItemCarrito[]
  itemsEnviados: ItemEnviado[]
  // undefined = sin mesa: el botón pide elegirla antes de enviar
  mesaNombre?: string
  onActualizarCantidad: (id: string, delta: number) => void
  onEliminar: (id: string) => void
  onEnviarACocina: () => void
  enviando: boolean
  subtotal: number
  // Solo para supervisor (Fase 2, Módulo 7): anular un plato ya enviado
  onAnular?: (item: ItemEnviado) => void
}

export function ResumenPedido({
  carrito,
  itemsEnviados,
  mesaNombre,
  onActualizarCantidad,
  onEliminar,
  onEnviarACocina,
  enviando,
  subtotal,
  onAnular,
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
          <h2 className="font-baloo2 text-2xl font-extrabold text-[var(--ink)]">Pedido</h2>
        </div>
        <p className="ml-13 mb-4 text-sm text-[var(--ink-soft)]">{mesaNombre ? `Mesa ${mesaNombre}` : 'Sin mesa'}</p>

        {itemsEnviados.length > 0 && (
          <div className="mb-3 rounded-lg bg-[var(--surface-alt)] p-3">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--ink-soft)]">
              Ya enviado a cocina
            </p>
            <div className="space-y-1.5">
              {itemsEnviados.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className={item.estado === 'anulado' ? 'text-[var(--ink-soft)] line-through' : 'text-[var(--ink)]'}>
                    {item.cantidad}× {item.nombre}
                    {item.porQr && (
                      <span className="ml-1.5 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">QR</span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold ${
                        item.estado === 'anulado' ? 'text-[var(--red)]' : 'text-[var(--ink-soft)]'
                      }`}
                    >
                      {ETIQUETA_ESTADO_ITEM[item.estado] ?? item.estado}
                    </span>
                    {onAnular && ESTADOS_ANULABLES.has(item.estado) && (
                      <button
                        type="button"
                        onClick={() => onAnular(item)}
                        className="rounded-md border border-red-200 px-1.5 py-0.5 text-[10.5px] font-bold text-[var(--red)] hover:bg-red-50"
                      >
                        Anular
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div id="cart-list" className="divide-y divide-[var(--border)]">
          {carrito.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--ink-soft)]">Agrega platos al pedido</p>
          ) : (
            carrito.map((item) => (
              <div key={item.id} className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[var(--ink)]">{item.cantidad}× {item.nombre}</span>
                    {item.nota && <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{item.nota}</p>}
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

        <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
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
            onClick={onEnviarACocina}
            disabled={carrito.length === 0 || enviando}
            className="flex-1 rounded-xl bg-[var(--orange)] py-3 text-base font-extrabold text-white hover:bg-[var(--orange-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Enviando…' : mesaNombre ? 'Enviar a cocina →' : 'Elegir mesa y enviar →'}
          </button>
        </div>
      </div>
    </aside>
  )
}
