interface FiltroPillsProps<T extends string> {
  opciones: readonly T[] | { key: T; label: string }[]
  activo: T
  onCambiar: (valor: T) => void
  chico?: boolean
}

export function FiltroPills<T extends string>({ opciones, activo, onCambiar, chico = false }: FiltroPillsProps<T>) {
  const normalizadas = opciones.map((o) => (typeof o === 'string' ? { key: o, label: o } : o))

  return (
    <div className={`flex flex-wrap ${chico ? 'gap-1.5' : 'mb-5 gap-2'}`}>
      {normalizadas.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onCambiar(o.key)}
          className={`rounded-full border font-semibold ${chico ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-[13px]'} ${
            activo === o.key
              ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
