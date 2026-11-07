export const GRADIENTES_FOTO: Record<string, string> = {
  p1: 'linear-gradient(135deg, #ffb877, #ff7a1a)',
  p2: 'linear-gradient(135deg, #ffcf6b, #f5a623)',
  p3: 'linear-gradient(135deg, #ff9d6b, #e0650a)',
  p4: 'linear-gradient(135deg, #ffdca0, #ffb04a)',
  p5: 'linear-gradient(135deg, #ff8f6b, #e14434)',
  p6: 'linear-gradient(135deg, #ffcf9c, #ff8f3d)',
}

export const FOTO_POR_DEFECTO = 'linear-gradient(135deg, #e8e8e8, #d0d0d0)'

// --orange/--orange-dark NO van acá a propósito — ver la misma nota en
// src/views/components/ui/constants.ts (ESTILOS_ADMIN): cada tenant los
// personaliza y de quedar fijos aquí tapan ese valor dinámico en
// Mesoneros y Cocina, que usan esta constante vía su layout.
export const ESTILOS_CSS = {
  '--bg': '#fffbf6',
  '--surface': '#ffffff',
  '--surface-alt': '#fff2e2',
  '--border': '#f1e3d1',
  '--ink': '#2b2118',
  '--ink-soft': '#8c8175',
  '--red': '#e14434',
} as React.CSSProperties