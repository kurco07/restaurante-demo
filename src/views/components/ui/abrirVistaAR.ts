// "Ver en RA" abre /ar en una pestaña nueva (window.open) en vez de un
// modal superpuesto en la misma página — ver VistaARPage.tsx para el
// porqué (aislar la cámara evita que un bug de Android/Chrome con el
// viewport, confirmado en pruebas reales, corrompa la página de pedidos).
export function abrirVistaAR(glbUrl: string, nombre: string, nombreRestaurante?: string) {
  const params = new URLSearchParams({ glb: glbUrl, nombre })
  if (nombreRestaurante) params.set('restaurante', nombreRestaurante)
  window.open(`/ar?${params.toString()}`, '_blank')
}
