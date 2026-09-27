// Paleta del módulo de administración (misma de mockup-admin-home.html).
// Se aplica como variables CSS en el contenedor del layout y los componentes
// las usan con clases tipo `bg-[var(--surface)]`.
export const ESTILOS_ADMIN = {
  '--bg': '#fffbf6',
  '--surface': '#ffffff',
  '--surface-alt': '#fff2e2',
  '--border': '#f1e3d1',
  '--ink': '#2b2118',
  '--ink-soft': '#8c8175',
  '--orange': '#ff7a1a',
  '--orange-dark': '#e0650a',
  '--orange-bg': '#fff2e2',
  '--gray-bg': '#f2efe9',
  '--green': '#24a24a',
  '--green-bg': '#e9f8ee',
  '--red': '#e14434',
  '--red-bg': '#fdeceb',
} as React.CSSProperties

export function formatearMoneda(valor: number) {
  return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
