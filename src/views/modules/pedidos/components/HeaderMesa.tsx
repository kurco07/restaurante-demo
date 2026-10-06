interface HeaderMesaProps {
  mesaNombre: string
  nombreUsuario: string
}

export function HeaderMesa({ mesaNombre, nombreUsuario }: HeaderMesaProps) {
  const inicial = nombreUsuario.charAt(0).toUpperCase() || 'M'

  return (
    <header className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--orange)] text-white text-xl font-extrabold">
          {mesaNombre}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">Mesa actual</div>
          <div className="text-base font-extrabold text-[var(--ink)]">Mesa {mesaNombre}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-alt)] text-xs font-extrabold text-[var(--orange-dark)]">
          {inicial}
        </div>
        {nombreUsuario}
      </div>
    </header>
  )
}
