import { useNavigate } from 'react-router-dom'

interface MesaSwitcherProps {
  mesaActual: number
  mesas: Array<{ numero: number; tiempo: string; estado: string }>
}

export function MesaSwitcher({ mesaActual, mesas }: MesaSwitcherProps) {
  const navigate = useNavigate()

  return (
    <div className="flex gap-2 mb-5 overflow-x-auto pb-2" role="tablist" aria-label="Mesas activas">
      {mesas.map((m) => (
        <button
          key={m.numero}
          role="tab"
          aria-selected={m.numero === mesaActual}
          onClick={m.numero !== mesaActual ? () => navigate(`/mesoneros/pedidos/${m.numero}`) : undefined}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${
            m.numero === mesaActual
              ? 'bg-[var(--orange)] text-white'
              : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-alt)]'
          }`}
        >
          Mesa {m.numero} · {m.tiempo}
        </button>
      ))}
    </div>
  )
}