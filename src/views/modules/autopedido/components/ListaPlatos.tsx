import type { CategoriaAutopedido, PlatoAutopedido } from '../../../../models/types'
import { TODAS } from '../../../../controllers/autopedido/useAutopedido'
import { fondoPlato } from './fondoPlato'

interface ListaPlatosProps {
  categorias: CategoriaAutopedido[]
  categoria: string
  onCambiarCategoria: (categoriaId: string) => void
  platos: PlatoAutopedido[]
  onAbrirPlato: (plato: PlatoAutopedido) => void
}

export function ListaPlatos({ categorias, categoria, onCambiarCategoria, platos, onAbrirPlato }: ListaPlatosProps) {
  const pills = [{ id: TODAS, nombre: 'Todos' }, ...categorias]

  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-5 pb-3">
        {pills.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCambiarCategoria(c.id)}
            className={`shrink-0 rounded-full border px-[15px] py-[7px] text-xs font-semibold ${
              c.id === categoria ? 'border-[var(--orange)] bg-[var(--orange)] text-white' : 'border-[var(--orange-bg)] bg-white text-gray-500'
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5">
        {platos.length === 0 && <p className="py-10 text-center text-[13px] text-gray-500">No hay platos en esta categoría.</p>}
        {platos.map((plato) => (
          <div key={plato.id} className="flex items-center gap-3 rounded-2xl border border-[var(--orange-bg)] bg-white p-3">
            <div
              className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-xl"
              style={{ background: fondoPlato(plato.imagen_url) }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.4} className="h-[26px] w-[26px]">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-sm font-bold text-gray-900">{plato.nombre}</p>
              {plato.descripcion && <p className="mb-1.5 text-[11px] leading-[1.3] text-gray-500">{plato.descripcion}</p>}
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold text-[var(--orange-dark)]">${Number(plato.precio).toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => onAbrirPlato(plato)}
                  className="rounded-full bg-[var(--orange)] px-[13px] py-1.5 text-[11.5px] font-bold text-white"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
