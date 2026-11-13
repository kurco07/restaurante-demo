import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CONTACTOS_SOPORTE, enlaceWhatsApp } from '../../../lib/soporte'

interface BotonAyudaProps {
  nombre: string
  rol: string
  // "barra": barras de mesonero y cocina. "lateral": barra lateral de
  // administración y gerencia (colores --sidebar-*)
  variante?: 'barra' | 'lateral'
}

// "Ayuda" durante el piloto (Fase 8, Módulo 4): abre un WhatsApp con el
// equipo, con un mensaje ya escrito que dice quién escribe y desde qué
// pantalla, para que nadie tenga que explicarlo en pleno servicio.
export function BotonAyuda({ nombre, rol, variante = 'barra' }: BotonAyudaProps) {
  const [abierto, setAbierto] = useState(false)
  const { pathname } = useLocation()
  const mensaje = `Hola, soy ${nombre} (${rol}). Necesito ayuda con la app, estoy en la pantalla ${pathname}: `

  const lateral = variante === 'lateral'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        title="Ayuda: escribirle al equipo por WhatsApp"
        className={
          lateral
            ? 'flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold text-[var(--sidebar-text)]/70 hover:bg-[var(--sidebar-text)]/5 hover:text-[var(--sidebar-text)]'
            : 'flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-alt)]'
        }
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px] shrink-0">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.2-1.5 2.3M12 17h.01" />
        </svg>
        <span className={lateral ? '' : 'hidden sm:inline'}>Ayuda</span>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            className="fixed inset-0 z-[150] cursor-default"
            onClick={() => setAbierto(false)}
          />
          <div
            role="menu"
            className={`absolute z-[151] w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--ink)] shadow-xl ${
              lateral ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2'
            }`}
          >
            <p className="px-2 pb-2 pt-1 text-xs text-[var(--ink-soft)]">
              ¿Algo no funciona? Escríbenos por WhatsApp y te ayudamos.
            </p>
            {CONTACTOS_SOPORTE.map((c) => (
              <a
                key={c.telefono}
                role="menuitem"
                href={enlaceWhatsApp(c.telefono, mensaje)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setAbierto(false)}
                className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-bold hover:bg-[var(--surface-alt)]"
              >
                <span>Escribirle a {c.nombre}</span>
                <span className="text-xs font-semibold text-[var(--green)]">WhatsApp</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
