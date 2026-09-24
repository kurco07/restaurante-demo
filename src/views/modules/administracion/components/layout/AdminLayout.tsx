import type { ReactNode } from 'react'
import type { Usuario } from '../../../../../models/types'
import { ESTILOS_ADMIN } from '../constants'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  usuario: Usuario
  children: ReactNode
}

// Estructura común de todas las pantallas de administración:
// barra lateral oscura a la izquierda + contenido a la derecha.
export function AdminLayout({ usuario, children }: AdminLayoutProps) {
  return (
    <div
      className="grid min-h-screen grid-cols-[232px_1fr] bg-[var(--bg)] text-[var(--ink)]"
      style={ESTILOS_ADMIN}
    >
      <AdminSidebar nombre={usuario.nombre} rol={usuario.rol} />
      <main className="min-w-0 max-w-[1280px] px-[34px] pb-10 pt-7">{children}</main>
    </div>
  )
}
