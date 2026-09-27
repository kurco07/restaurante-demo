import type { ReactNode } from 'react'

interface PanelLateralProps {
  titulo: string
  subtitulo: string
  children: ReactNode
}

// Panel blanco de la derecha (editor de insumo, registrar lote, ajuste manual…).
export function PanelLateral({ titulo, subtitulo, children }: PanelLateralProps) {
  return (
    <aside className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-[18px]">
      <p className="mb-0.5 text-[19px] font-extrabold">{titulo}</p>
      <p className="mb-4 text-xs text-[var(--ink-soft)]">{subtitulo}</p>
      {children}
    </aside>
  )
}

interface CampoProps {
  label: string
  children: ReactNode
  apagado?: boolean
}

// Campo de solo lectura: el prototipo muestra los valores pero todavía no los edita.
export function Campo({ label, children, apagado = false }: CampoProps) {
  return (
    <div className="mb-3">
      <div className="mb-[5px] text-[11.5px] font-semibold text-[var(--ink-soft)]">{label}</div>
      <div
        className={`rounded-[10px] border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-[13.5px] ${
          apagado ? 'font-medium text-[var(--ink-soft)]' : 'font-semibold'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export function FilaCampos({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>
}

export function Interruptor({ label, encendido }: { label: string; encendido: boolean }) {
  return (
    <div className="flex items-center justify-between pb-3.5 pt-1">
      <span className="text-[13px] font-semibold">{label}</span>
      <Switch encendido={encendido} />
    </div>
  )
}

interface SwitchProps {
  encendido: boolean
  onCambiar?: () => void
  label?: string
}

export function Switch({ encendido, onCambiar, label }: SwitchProps) {
  const clase = `relative block h-[22px] w-[38px] shrink-0 rounded-full ${encendido ? 'bg-[var(--orange)]' : 'bg-[var(--border)]'}`
  const bolita = (
    <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white ${encendido ? 'left-[18px]' : 'left-0.5'}`} />
  )

  if (!onCambiar) return <span className={clase}>{bolita}</span>

  return (
    <button type="button" role="switch" aria-checked={encendido} aria-label={label} onClick={onCambiar} className={clase}>
      {bolita}
    </button>
  )
}

export function NotaInfo({ children }: { children: ReactNode }) {
  return (
    <div className="my-1 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-3 py-[11px] text-xs leading-[1.4] text-[var(--ink-soft)]">
      {children}
    </div>
  )
}

export function BotonGuardar({ children }: { children: string }) {
  return (
    <button
      type="button"
      className="mt-3.5 w-full rounded-xl bg-[var(--orange)] p-3.5 text-center text-sm font-bold text-white"
    >
      {children}
    </button>
  )
}

export function EnlaceEliminar({ children }: { children: string }) {
  return (
    <button type="button" className="mt-3 w-full text-center text-[12.5px] font-semibold text-[var(--red)]">
      {children}
    </button>
  )
}
