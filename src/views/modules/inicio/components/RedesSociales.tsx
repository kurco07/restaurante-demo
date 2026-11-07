// Personalización completa, Ronda 2 — acceso directo a redes desde la
// vitrina pública. Todos los campos son opcionales: cada botón solo
// aparece si el tenant configuró ese enlace en Configuración → Marca.
// WhatsApp es un botón de CONTACTO (abre wa.me), nunca para pedir — los
// pedidos siguen siendo solo por QR en la mesa (CLAUDE.md).
interface RedesSocialesProps {
  instagram?: string | null
  whatsapp?: string | null
  facebook?: string | null
  enlaceLibre?: string | null
  enlaceLibreEtiqueta?: string | null
}

function normalizarUrl(valor: string) {
  return /^https?:\/\//i.test(valor) ? valor : `https://${valor}`
}

export function RedesSociales({ instagram, whatsapp, facebook, enlaceLibre, enlaceLibreEtiqueta }: RedesSocialesProps) {
  const enlaces: { href: string; label: string; icono: React.ReactNode }[] = []

  if (instagram) {
    enlaces.push({
      href: normalizarUrl(instagram),
      label: 'Instagram',
      icono: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    })
  }
  if (whatsapp) {
    const numero = whatsapp.replace(/\D/g, '')
    enlaces.push({
      href: `https://wa.me/${numero}`,
      label: 'WhatsApp',
      icono: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-4.7-1.5L4 20z" />
          <path d="M9 10c0 3 2 5 5 5" strokeLinecap="round" />
        </svg>
      ),
    })
  }
  if (facebook) {
    enlaces.push({
      href: normalizarUrl(facebook),
      label: 'Facebook',
      icono: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path d="M14 21v-7h2.5l.5-3H14V9a1.5 1.5 0 011.5-1.5H17V4.5h-2A4 4 0 0011 8.5V11H9v3h2v7" />
        </svg>
      ),
    })
  }
  if (enlaceLibre) {
    enlaces.push({
      href: normalizarUrl(enlaceLibre),
      label: enlaceLibreEtiqueta || 'Más',
      icono: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path d="M10 14a3.5 3.5 0 005 0l3-3a3.5 3.5 0 00-5-5l-1 1" />
          <path d="M14 10a3.5 3.5 0 00-5 0l-3 3a3.5 3.5 0 005 5l1-1" />
        </svg>
      ),
    })
  }

  if (enlaces.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {enlaces.map((e) => (
        <a
          key={e.label}
          href={e.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={e.label}
          title={e.label}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[var(--orange)] hover:text-[var(--orange)]"
        >
          {e.icono}
        </a>
      ))}
    </div>
  )
}
