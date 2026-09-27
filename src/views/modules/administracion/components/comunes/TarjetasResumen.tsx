interface Resumen {
  valor: string | number
  etiqueta: string
  alerta?: boolean
}

export function TarjetasResumen({ items }: { items: Resumen[] }) {
  return (
    <div className="mb-5 grid grid-cols-3 gap-3.5">
      {items.map((item) => (
        <div key={item.etiqueta} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-3.5">
          <div className={`text-[21px] font-extrabold ${item.alerta ? 'text-[var(--red)]' : ''}`}>{item.valor}</div>
          <div className="mt-[3px] text-xs text-[var(--ink-soft)]">{item.etiqueta}</div>
        </div>
      ))}
    </div>
  )
}
