import type { ReactNode } from 'react'

interface EncabezadoAdminProps {
  ruta: string
  titulo: string
  children?: ReactNode
}

export function EncabezadoAdmin({ ruta, titulo, children }: EncabezadoAdminProps) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3.5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">{ruta}</div>
        <h1 className="mt-1 text-[27px] font-extrabold">{titulo}</h1>
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </header>
  )
}

interface BuscadorAdminProps {
  valor: string
  onCambiar: (valor: string) => void
  placeholder: string
}

export function BuscadorAdmin({ valor, onCambiar, placeholder }: BuscadorAdminProps) {
  return (
    <input
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      placeholder={placeholder}
      className="w-[220px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-[13.5px] outline-none placeholder:text-[var(--ink-soft)] focus:border-[var(--orange)]"
    />
  )
}

export function BotonNuevo({ children, onClick }: { children: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap rounded-full bg-[var(--orange)] px-5 py-[11px] text-[13.5px] font-bold text-white"
    >
      {children}
    </button>
  )
}
