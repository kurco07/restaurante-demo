// Lista curada de tipografías (Fase 7, Personalización — Ronda 1). A
// propósito no es texto libre: evita que un restaurante termine con una
// fuente rota o ilegible. "valor" es lo que se guarda en
// personalizacion_marca.fuente y el nombre real de familia CSS.
export interface FuenteMarca {
  valor: string
  label: string
  googleFontsParam: string
}

export const FUENTES_DISPONIBLES: FuenteMarca[] = [
  { valor: 'Inter', label: 'Inter (la actual)', googleFontsParam: 'Inter:wght@400;700' },
  { valor: 'Poppins', label: 'Poppins — moderna, redondeada', googleFontsParam: 'Poppins:wght@400;700' },
  { valor: 'Baloo 2', label: 'Baloo 2 — juguetona', googleFontsParam: 'Baloo+2:wght@400;700' },
  { valor: 'Playfair Display', label: 'Playfair Display — elegante', googleFontsParam: 'Playfair+Display:wght@400;700' },
  { valor: 'Nunito', label: 'Nunito — amigable', googleFontsParam: 'Nunito:wght@400;700' },
  { valor: 'Oswald', label: 'Oswald — fuerte, condensada', googleFontsParam: 'Oswald:wght@400;700' },
]
