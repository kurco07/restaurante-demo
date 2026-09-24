export const CATEGORIAS_FIJAS = [
  'Favoritos',
  'Combos',
  'Hamburguesas',
  'Pizzas',
  'Pollo',
  'Acompañantes',
  'Bebidas',
] as const

export const GRADIENTES_FOTO: Record<string, string> = {
  p1: 'linear-gradient(135deg, #ffb877, #ff7a1a)',
  p2: 'linear-gradient(135deg, #ffcf6b, #f5a623)',
  p3: 'linear-gradient(135deg, #ff9d6b, #e0650a)',
  p4: 'linear-gradient(135deg, #ffdca0, #ffb04a)',
  p5: 'linear-gradient(135deg, #ff8f6b, #e14434)',
  p6: 'linear-gradient(135deg, #ffcf9c, #ff8f3d)',
}

export const FOTO_POR_DEFECTO = 'linear-gradient(135deg, #e8e8e8, #d0d0d0)'

export const ESTILOS_CSS = {
  '--bg': '#fffbf6',
  '--surface': '#ffffff',
  '--surface-alt': '#fff2e2',
  '--border': '#f1e3d1',
  '--ink': '#2b2118',
  '--ink-soft': '#8c8175',
  '--orange': '#ff7a1a',
  '--orange-dark': '#e0650a',
  '--red': '#e14434',
} as React.CSSProperties