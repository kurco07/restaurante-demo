import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { Rol } from '../../../../../models/types'

interface AdminSidebarProps {
  nombre: string
  rol: Rol
}

interface EnlaceSidebar {
  label: string
  to: string
  icono: ReactNode
  // Otras rutas en las que el enlace también debe verse activo
  activoEn?: string[]
}

// Las secciones que todavía no existen llevan a /proximamente,
// igual que el resto del prototipo navegable.
const enlaces: EnlaceSidebar[] = [
  {
    label: 'Panel',
    to: '/administracion',
    icono: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    label: 'Pedidos',
    to: '/administracion/pedidos',
    icono: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  },
  {
    label: 'Menú',
    to: '/administracion/menu',
    icono: <path d="M3 10h18M3 14h18M4 10a8 6 0 0116 0M4 14a1 1 0 001 1h14a1 1 0 001-1" />,
  },
  {
    label: 'Inventario',
    // Aterriza en Insumos (primera pestaña) — desde ahí se navega a las
    // otras pestañas del inventario vía <InventarioTabs>.
    to: '/administracion/insumos',
    activoEn: ['/administracion/insumos', '/administracion/movimientos', '/administracion/proveedores', '/administracion/compras'],
    icono: (
      <>
        <path d="M3 8l9-5 9 5-9 5-9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
  },
  {
    label: 'Mesas',
    to: '/administracion/mesas',
    icono: (
      <>
        <rect x="3" y="9" width="18" height="4" rx="1.5" />
        <path d="M5 13v7M19 13v7" />
      </>
    ),
  },
  {
    label: 'Personal',
    to: '/administracion/personal',
    icono: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="18" cy="9" r="2.3" />
        <path d="M15.5 14.2c2 .6 3.5 2.5 3.5 5.8" />
      </>
    ),
  },
  {
    label: 'Reportes',
    to: '/administracion/reportes',
    icono: <path d="M4 20V11M10 20V5M16 20v-6M22 20H2" />,
  },
  {
    label: 'Configuración',
    to: '/administracion/configuracion',
    icono: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </>
    ),
  },
]

const etiquetaRol: Partial<Record<Rol, string>> = {
  administracion: 'Administración',
  gerencia: 'Gerencia',
}

export function AdminSidebar({ nombre, rol }: AdminSidebarProps) {
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
            // `end` evita que "Panel" quede activo también en /administracion/menu
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
