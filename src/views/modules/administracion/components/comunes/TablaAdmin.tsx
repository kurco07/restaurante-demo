import type { ReactNode } from 'react'

interface TablaAdminProps {
  columnas: string
  encabezados: { label: string; alineacion?: 'centro' | 'derecha' }[]
  pie: string
  children: ReactNode
}

// Contenedor de tabla con grid: `columnas` es el grid-template-columns que
// comparten el encabezado y cada FilaTabla (se pasa como variable CSS).
export function TablaAdmin({ columnas, encabezados, pie, children }: TablaAdminProps) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
      style={{ '--columnas': columnas } as React.CSSProperties}
    >
      <div className="grid grid-cols-[var(--columnas)] items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-alt)] px-[18px] py-[13px] text-[10.5px] font-bold uppercase tracking-[0.04em] text-[var(--ink-soft)]">
        {encabezados.map((e) => (
          <span
            key={e.label}
            className={e.alineacion === 'centro' ? 'text-center' : e.alineacion === 'derecha' ? 'text-right' : ''}
          >
            {e.label}
          </span>
        ))}
      </div>
      <div className="divide-y divide-[var(--border)]">{children}</div>
      <div className="border-t border-[var(--border)] px-[18px] py-3 text-center text-[11.5px] text-[var(--ink-soft)]">
        {pie}
      </div>
    </div>
  )
}

interface FilaTablaProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function FilaTabla({ children, className = '', onClick }: FilaTablaProps) {
  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[var(--columnas)] items-center gap-2 px-[18px] py-[13px] text-[13px] ${
        onClick ? 'cursor-pointer hover:bg-[var(--surface-alt)]/50' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
