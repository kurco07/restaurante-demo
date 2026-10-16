import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

export interface PestanaBarra {
  label: string
  to: string
  // `end` para que la pestaña raíz no quede activa también en sus subrutas
  end?: boolean
  contador?: number
  // Contador que pide acción (p. ej. platos listos para llevar): en verde
  urgente?: boolean
  icono: ReactNode
}

interface BarraSuperiorProps {
  pestanas: PestanaBarra[]
  // Lo que va a la derecha: usuario, estado de conexión, reloj...
  derecha: ReactNode
}

// Barra superior de los módulos operativos (mesonero, cocina), pensados
// para tablet o celular. En pantallas chicas las pestañas quedan solo con
// ícono y contador para que quepan. Usa las variables de color del módulo.
export function BarraSuperior({ pestanas, derecha }: BarraSuperiorProps) {
  return (
    <header className="sticky top-0 z-[100] border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-3 px-4 py-2.5 sm:px-7">
        <div className="hidden text-lg font-extrabold text-[var(--ink)] md:block">
          Fast <span className="text-[var(--orange)]">&amp; Co.</span>
        </div>

        <nav className="flex gap-1">
          {pestanas.map((p) => (
            <NavLink
              key={p.to}
              to={p.to}
              end={p.end}
              title={p.label}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold ${
                  isActive ? 'bg-[var(--orange)] text-white' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px] shrink-0">
                    {p.icono}
                  </svg>
                  <span className="hidden sm:inline">{p.label}</span>
                  {!!p.contador && (
                    <span
                      className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-extrabold ${
                        isActive
                          ? 'bg-white text-[var(--orange-dark)]'
                          : p.urgente
                            ? 'bg-green-600 text-white'
                            : 'bg-[var(--orange)] text-white'
                      }`}
                    >
                      {p.contador}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">{derecha}</div>
      </div>
    </header>
  )
}
