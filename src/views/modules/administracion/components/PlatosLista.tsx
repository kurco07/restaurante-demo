import type { CategoriaMenu, MenuItem } from '../../../../models/types'

interface PlatosListaProps {
  platos: MenuItem[]
  categorias: CategoriaMenu[]
  busqueda: string
  onBuscar: (valor: string) => void
  seleccionadoId: string | null
  onSeleccionar: (id: string) => void
  onNuevo: () => void
}

export function PlatosLista({
  platos,
  categorias,
  busqueda,
  onBuscar,
  seleccionadoId,
  onSeleccionar,
  onNuevo,
}: PlatosListaProps) {
  function nombreCategoria(id: string) {
    return categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría'
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] p-3.5">
        <input
          type="text"
          placeholder="Buscar plato..."
          value={busqueda}
          onChange={(e) => onBuscar(e.target.value)}
          className="flex-1 rounded-full border border-[var(--border)] px-3.5 py-2 text-[13px]"
        />
        <button
          type="button"
          onClick={onNuevo}
          className="whitespace-nowrap rounded-full bg-[var(--orange)] px-3.5 py-2 text-[12.5px] font-bold text-white"
        >
          + Nuevo
        </button>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {platos.map((plato) => (
          <button
            key={plato.id}
            type="button"
            onClick={() => onSeleccionar(plato.id)}
            className={`flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left last:border-none hover:bg-[var(--surface-alt)] ${
              seleccionadoId === plato.id ? 'bg-[var(--surface-alt)]' : ''
            }`}
          >
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-bold">{plato.nombre}</div>
              <div className="text-[11.5px] text-[var(--ink-soft)]">{nombreCategoria(plato.categoria_id)}</div>
            </div>
            <span className="shrink-0 text-[13px] font-bold text-[var(--orange-dark)]">
              ${plato.precio_base.toFixed(2)}
            </span>
          </button>
        ))}
        {platos.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[var(--ink-soft)]">No hay platos que coincidan.</p>
        )}
      </div>
    </div>
  )
}
