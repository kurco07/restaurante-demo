// Paleta y formato compartidos por las pantallas de "back office"
// (administración y gerencia) — antes vivían dentro de administración y
// gerencia los importaba cruzando de módulo; movido aquí para que ambos
// dependan de un mismo lugar y no se desincronicen entre sí.
//
// --orange/--orange-dark NO van acá a propósito: esos dos los personaliza
// cada tenant (Fase 7 Módulo 4, useAplicarMarca.ts los fija en
// document.documentElement) y de quedar fijos aquí tapan ese valor
// dinámico en todo lo que use ESTILOS_ADMIN — se heredan solas desde la
// raíz del documento, nunca hace falta repetirlas.
export const ESTILOS_ADMIN = {
  '--bg': '#fffbf6',
  '--surface': '#ffffff',
  '--surface-alt': '#fff2e2',
  '--border': '#f1e3d1',
  '--ink': '#2b2118',
  '--ink-soft': '#8c8175',
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

export const ETIQUETA_METODO_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  pago_movil: 'Pago móvil',
}
