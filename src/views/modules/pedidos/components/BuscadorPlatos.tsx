interface BuscadorPlatosProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function BuscadorPlatos({ value, onChange, placeholder = 'Buscar plato...' }: BuscadorPlatosProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--ink-soft)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
      />
    </div>
  )
}