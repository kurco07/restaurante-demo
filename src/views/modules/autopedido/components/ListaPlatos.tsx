import type { PlatoAutopedido } from '../../../../models/types'

interface ListaPlatosProps {
  categorias: string[]
  categoria: string
  onCambiarCategoria: (categoria: string) => void
  platos: PlatoAutopedido[]
  onPersonalizar: (plato: PlatoAutopedido) => void
}

export function ListaPlatos({ categorias, categoria, onCambiarCategoria, platos, onPersonalizar }: ListaPlatosProps) {
  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-5 pb-3">
        {categorias.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCambiarCategoria(c)}
            className={`shrink-0 rounded-full border px-[15px] py-[7px] text-xs font-semibold ${
              c === categoria ? 'border-orange-500 bg-orange-500 text-white' : 'border-orange-100 bg-white text-gray-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5">
        {platos.map((plato) => (
          <div key={plato.id} className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3">
            <div className={`flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${plato.gradiente}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.4} className="h-[26px] w-[26px]">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="mb-0.5 text-sm font-bold text-gray-900">{plato.nombre}</p>
              <p className="mb-1.5 text-[11px] leading-[1.3] text-gray-500">{plato.descripcion}</p>
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold text-orange-600">${plato.precio.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => onPersonalizar(plato)}
                  className="rounded-full bg-orange-500 px-[13px] py-1.5 text-[11.5px] font-bold text-white"
                >
                  Personalizar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
