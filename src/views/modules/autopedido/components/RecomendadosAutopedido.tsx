import type { PlatoAutopedido } from '../../../../models/types'

interface RecomendadosAutopedidoProps {
  items: { plato: PlatoAutopedido; frase: string }[]
  onAbrirPlato: (plato: PlatoAutopedido) => void
}

// "⭐ Recomendados de hoy" arriba del menú del cliente por QR (Fase 6,
// Módulo 4). Tocar uno lo abre para agregarlo, igual que en la lista.
export function RecomendadosAutopedido({ items, onAbrirPlato }: RecomendadosAutopedidoProps) {
  if (items.length === 0) return null

  return (
    <section className="px-5 pb-3">
      <p className="mb-2 text-[13px] font-extrabold text-gray-800">⭐ Recomendados de hoy</p>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {items.map(({ plato, frase }) => (
          <button
            key={plato.id}
            type="button"
            onClick={() => onAbrirPlato(plato)}
            className="w-[210px] shrink-0 rounded-2xl border border-orange-100 bg-orange-50 px-3.5 py-2.5 text-left"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[13.5px] font-extrabold text-gray-800">{plato.nombre}</span>
              <span className="shrink-0 text-[12.5px] font-bold text-orange-600">${plato.precio.toFixed(2)}</span>
            </span>
            <span className="mt-0.5 block text-[12px] leading-snug text-gray-500 line-clamp-2">{frase}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
