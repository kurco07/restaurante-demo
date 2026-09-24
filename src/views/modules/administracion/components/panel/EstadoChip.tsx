interface EstadoChipProps {
  tono: 'verde' | 'naranja' | 'rojo'
  children: string
}

const clasePorTono: Record<EstadoChipProps['tono'], string> = {
  verde: 'bg-[var(--green-bg)] text-[var(--green)]',
  naranja: 'bg-[var(--orange-bg)] text-[var(--orange-dark)]',
  rojo: 'bg-[var(--red-bg)] text-[var(--red)]',
}

export function EstadoChip({ tono, children }: EstadoChipProps) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${clasePorTono[tono]}`}>
      {children}
    </span>
  )
}
