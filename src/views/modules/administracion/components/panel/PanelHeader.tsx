import type { PeriodoPanel } from '../../../../../models/types'

interface PanelHeaderProps {
  nombre: string
  fechaHoy: string
  periodo: PeriodoPanel
  onCambiarPeriodo: (periodo: PeriodoPanel) => void
}

const periodos: { key: PeriodoPanel; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
]

export function PanelHeader({ nombre, fechaHoy, periodo, onCambiarPeriodo }: PanelHeaderProps) {
  const primerNombre = nombre.split(' ')[0]
  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3.5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--acento)]">
          Panel de administración · {fechaHoy}
        </div>
        <h1 className="mt-1 text-[27px] font-extrabold">Hola, {primerNombre}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          {periodos.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onCambiarPeriodo(p.key)}
              className={`rounded-full px-[15px] py-[7px] text-[12.5px] font-semibold ${
                periodo === p.key ? 'bg-[var(--orange)] text-white' : 'text-[var(--ink-soft)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Notificaciones: sin funcionalidad todavía */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path d="M6 8a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8z" />
            <path d="M9.5 16a2.5 2.5 0 005 0" />
          </svg>
          <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full border-[1.5px] border-[var(--surface)] bg-[var(--red)]" />
        </button>

        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--orange-bg)] font-bold text-[var(--orange-dark)]">
          {inicial}
        </div>
      </div>
    </header>
  )
}
