interface HeaderMesaProps {
  mesaNumero: number
  zona: string
  user: { user_metadata?: { nombre?: string }; email?: string } | null
}

export function HeaderMesa({ mesaNumero, zona, user }: HeaderMesaProps) {
  const inicial = user?.user_metadata?.nombre?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'V'
  const nombre = user?.user_metadata?.nombre || user?.email || 'Mesonero'

  return (
    <header className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--orange)] text-white text-xl font-extrabold">
          {mesaNumero}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">Mesa actual</div>
          <div className="text-base font-extrabold text-[var(--ink)]">{zona}</div>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm text-[var(--ink-soft)]">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--orange)]" />
          Cocina 6 min
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-alt)] text-xs font-extrabold text-[var(--orange-dark)]">
            {inicial}
          </div>
          {nombre}
        </div>
      </div>
    </header>
  )
}