import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../controllers/auth/useAuth'
import type { Rol } from '../../../models/types'

export interface EnlaceSidebar {
  label: string
  to: string
  icono: ReactNode
  // Otras rutas en las que el enlace también debe verse activo
  activoEn?: string[]
  // Número a la derecha (ej. alertas activas); 0 o sin valor, no se muestra
  contador?: number
}

interface PanelSidebarProps {
  enlaces: EnlaceSidebar[]
  nombre: string
  rol: Rol
}

const etiquetaRol: Partial<Record<Rol, string>> = {
  administracion: 'Administración',
  gerencia: 'Gerencia',
}

// Barra lateral oscura compartida por los paneles de administración y
// gerencia: cada módulo pasa sus propios enlaces. Abajo, el usuario con
// "Cerrar sesión".
export function PanelSidebar({ enlaces, nombre, rol }: PanelSidebarProps) {
  const { pathname } = useLocation()
  const { signOut } = useAuth()
  const navigate = useNavigate()
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
    <aside className="flex flex-col bg-[var(--sidebar-bg)] px-4 py-[22px] text-[var(--sidebar-text)]">
      <div className="mb-7 mt-1 px-2.5 text-lg font-extrabold">
        Fast <span className="text-[var(--orange)]">&amp; Co.</span>
      </div>

      <nav className="flex flex-1 flex-col gap-[3px]">
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.label}
            to={enlace.to}
            // `end` evita que el enlace raíz ("Panel", "Ventas") quede activo
            // también en sus subrutas
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold ${
                (isActive || enlace.activoEn?.some((ruta) => pathname.startsWith(ruta))) &&
                enlace.to !== '/proximamente'
                  ? 'bg-[var(--orange)] text-white'
                  : 'text-[var(--sidebar-text)]/70 hover:text-[var(--sidebar-text)]'
              }`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px] shrink-0">
              {enlace.icono}
            </svg>
            {enlace.label}
            {!!enlace.contador && (
              <span className="ml-auto min-w-[20px] rounded-full bg-[var(--red)] px-1.5 py-px text-center text-[11px] font-bold text-white">
                {enlace.contador}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-2.5 flex items-center gap-2.5 border-t border-[var(--sidebar-text)]/15 px-2.5 pb-1 pt-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--orange-bg)] text-[12.5px] font-bold text-[var(--acento)]">
          {nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-[12.5px] font-bold text-[var(--sidebar-text)]">{nombre}</div>
          <div className="text-[11px] text-[var(--sidebar-text)]/60">{etiquetaRol[rol] ?? rol}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={cerrarSesion}
        disabled={saliendo}
        className="mt-2 flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-[var(--sidebar-text)]/70 hover:bg-[var(--sidebar-text)]/5 hover:text-[var(--sidebar-text)] disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px] shrink-0">
          <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11" />
        </svg>
        {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
    </aside>
  )
}
