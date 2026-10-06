// Íconos mínimos en línea para las pantallas de login/registro — mismo
// estilo que el resto de la app (trazo fino, sin librería de íconos nueva).
interface IconoProps {
  className?: string
}

export function IconoCorreo({ className = 'h-[18px] w-[18px]' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 6.5L12 13l8.5-6.5" />
    </svg>
  )
}

export function IconoCandado({ className = 'h-[18px] w-[18px]' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  )
}

export function IconoOjo({ className = 'h-[18px] w-[18px]' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconoOjoTachado({ className = 'h-[18px] w-[18px]' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.4 10.4 0 0112 5c6.5 0 10 7 10 7a16.3 16.3 0 01-3.4 4.4M6.5 6.6C3.8 8.3 2 12 2 12s3.5 7 10 7a9.7 9.7 0 004.1-.9" />
      <path d="M9.5 9.8a3 3 0 004.2 4.2" />
    </svg>
  )
}

export function IconoPersona({ className = 'h-[18px] w-[18px]' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  )
}

export function IconoTelefono({ className = 'h-[18px] w-[18px]' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M6 3h3l1.5 5-2 1.5a12 12 0 006 6L16 14l5 1.5V19a2 2 0 01-2 2C9.4 21 3 14.6 3 6a2 2 0 013-3z" />
    </svg>
  )
}

export function IconoRestaurante({ className = 'h-[18px] w-[18px]' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M4 3v8a2 2 0 002 2v8M4 3v4M4 7h4V3M11 3v9a2 2 0 002 2v7" />
      <path d="M11 3c3 0 4 2.5 4 5s-1 5-4 5" />
    </svg>
  )
}

export function IconoEscudo({ className = 'h-4 w-4' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M12 2l8 3.5v5.5c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5.5L12 2z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function IconoRayo({ className = 'h-4 w-4' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  )
}

export function IconoWifiOff({ className = 'h-4 w-4' }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M3 3l18 18" />
      <path d="M8.5 16.5a5 5 0 017 0M5.5 13.5a9 9 0 013.5-2.3M12 20h.01M15.5 10a9 9 0 013 1.8" />
    </svg>
  )
}
