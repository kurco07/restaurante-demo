import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { Rol } from '../../../models/types'

export interface EnlaceSidebar {
  label: string
  to: string
  icono: ReactNode
  // Otras rutas en las que el enlace también debe verse activo
  activoEn?: string[]
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
// gerencia: cada módulo pasa sus propios enlaces.
export function PanelSidebar({ enlaces, nombre, rol }: PanelSidebarProps) {
  const { pathname } = useLocation()

  return (
    <aside className="flex flex-col bg-[var(--ink)] px-4 py-[22px] text-white">
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
                  : 'text-[#cfc6ba] hover:text-white'
              }`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px] shrink-0">
              {enlace.icono}
            </svg>
            {enlace.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-2.5 flex items-center gap-2.5 border-t border-[#423528] px-2.5 pb-1 pt-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--orange-bg)] text-[12.5px] font-bold text-[var(--orange-dark)]">
          {nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-[12.5px] font-bold text-white">{nombre}</div>
          <div className="text-[11px] text-[#a89d8d]">{etiquetaRol[rol] ?? rol}</div>
        </div>
      </div>
    </aside>
  )
}
