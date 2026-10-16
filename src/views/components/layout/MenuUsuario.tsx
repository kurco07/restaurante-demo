import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../controllers/auth/useAuth'

interface MenuUsuarioProps {
  nombre: string
  rol: string
}

// Inicial + nombre del usuario con un desplegable para cerrar sesión.
// Compartido por las barras superiores de mesonero y cocina; usa las
// variables de color (--surface, --ink...) del módulo que lo contiene.
export function MenuUsuario({ nombre, rol }: MenuUsuarioProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  async function cerrarSesion() {
    setSaliendo(true)
    try {
      await signOut()
    } finally {
      setSaliendo(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-alt)]"
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-alt)] text-xs font-extrabold text-[var(--orange-dark)]">
          {nombre.charAt(0).toUpperCase() || '?'}
        </span>
        <span className="hidden max-w-[140px] truncate sm:inline">{nombre}</span>
        <span className="text-[10px] text-[var(--ink-soft)]">▾</span>
      </button>

      {abierto && (
        <>
          {/* Cierra el menú al tocar fuera */}
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl"
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-bold text-[var(--ink)]">{nombre}</p>
              <p className="text-xs text-[var(--ink-soft)]">{rol}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={cerrarSesion}
              disabled={saliendo}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-[var(--red)] hover:bg-red-50 disabled:opacity-50"
            >
              {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
