interface RecomendadosMenuProps {
  items: { id: string; nombre: string; frase: string }[]
  onAbrir: (platoId: string) => void
}

// "⭐ Recomendados de hoy" arriba del menú del mesonero (Fase 6, Módulo 4):
// los platos que gerencia publicó hoy con su frase para ofrecerlos. Tocar
// uno lo abre para anotarlo. Sin recomendados no ocupa lugar.
export function RecomendadosMenu({ items, onAbrir }: RecomendadosMenuProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-4">
      <p className="mb-2 text-[13px] font-extrabold text-[var(--ink)]">⭐ Recomendados de hoy</p>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {items.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onAbrir(r.id)}
            className="w-[220px] shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-2.5 text-left"
          >
            <span className="block text-[13.5px] font-extrabold text-[var(--ink)]">{r.nombre}</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-[var(--ink-soft)] line-clamp-2">{r.frase}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
