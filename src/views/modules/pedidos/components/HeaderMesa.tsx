interface HeaderMesaProps {
  // undefined = pedido sin mesa todavía (flujo "menú primero")
  mesaNombre?: string
  // Aviso cuando la mesa de la URL ya no acepta pedidos (de otro mesonero,
  // por limpiar): el borrador se conserva y hay que moverlo a otra mesa.
  aviso?: string
  onCambiarMesa: () => void
}

export function HeaderMesa({ mesaNombre, aviso, onCambiarMesa }: HeaderMesaProps) {
  return (
    <header className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 min-w-12 items-center justify-center rounded-xl px-2 text-xl font-extrabold ${
              mesaNombre ? 'bg-[var(--orange)] text-white' : 'border-2 border-dashed border-[var(--border)] text-[var(--ink-soft)]'
            }`}
          >
            {mesaNombre ?? '?'}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
              {mesaNombre ? 'Pedido para' : 'Pedido sin mesa'}
            </div>
            <div className="text-base font-extrabold text-[var(--ink)]">
              {mesaNombre ? `Mesa ${mesaNombre}` : 'Elige la mesa al enviar'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCambiarMesa}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--orange-dark)] hover:border-[var(--orange)]"
        >
          {mesaNombre ? 'Cambiar mesa' : 'Elegir mesa'}
        </button>
      </div>
      {aviso && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">{aviso}</p>
      )}
    </header>
  )
}
