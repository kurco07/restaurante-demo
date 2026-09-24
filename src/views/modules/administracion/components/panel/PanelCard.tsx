import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PanelCardProps {
  titulo: string
  subtitulo: string
  enlace?: { label: string; to: string }
  children: ReactNode
}

// Tarjeta blanca con título, subtítulo y un enlace opcional arriba a la derecha.
export function PanelCard({ titulo, subtitulo, enlace, children }: PanelCardProps) {
  return (
    <section className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-[18px]">
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <p className="mb-[3px] text-[17px] font-extrabold">{titulo}</p>
          <p className="mb-4 text-xs text-[var(--ink-soft)]">{subtitulo}</p>
        </div>
        {enlace && (
          <Link to={enlace.to} className="whitespace-nowrap text-xs font-bold text-[var(--orange-dark)]">
            {enlace.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
