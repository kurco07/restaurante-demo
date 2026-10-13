import type { ReactNode } from 'react'

interface ModalAdminProps {
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

// Overlay genérico para los editores de administración que antes vivían
// en el panel lateral (insumo, proveedor...) — centra la atención en una
// sola cosa a la vez, en vez de competir por espacio con la tabla.
export function ModalAdmin({ titulo, onCerrar, children }: ModalAdminProps) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--surface)] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-extrabold">{titulo}</p>
          <button
            type="button"
            onClick={onCerrar}
            className="text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
