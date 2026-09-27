import type { ReactNode } from 'react'

interface SeccionConfigProps {
  titulo: string
  subtitulo: string
  children: ReactNode
}

export function SeccionConfig({ titulo, subtitulo, children }: SeccionConfigProps) {
  return (
    <section className="mb-[18px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-[22px] py-5">
      <p className="mb-[3px] text-[17px] font-extrabold">{titulo}</p>
      <p className="mb-4 text-xs text-[var(--ink-soft)]">{subtitulo}</p>
      {children}
    </section>
  )
}
