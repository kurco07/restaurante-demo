// Copias locales del autopedido en el celular del cliente (Fase 8,
// Módulo 1). El cliente no usa PowerSync (no tiene sesión), así que lo
// que tiene que sobrevivir a una recarga sin internet se guarda aquí: el
// último menú de la mesa, lo último que se vio pedido en la mesa y el
// carrito por enviar. Todo por mesa, y todo tolera que el navegador no
// deje guardar (modo privado): en ese caso simplemente no hay copia.

export function leerLocal<T>(clave: string): T | null {
  try {
    const crudo = localStorage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as T) : null
  } catch {
    return null
  }
}

export function guardarLocal(clave: string, valor: unknown) {
  try {
    if (valor == null) localStorage.removeItem(clave)
    else localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // Sin almacenamiento: se sigue funcionando, solo que sin copia
  }
}

export const claves = {
  menu: (mesaId: string) => `autopedido:menu:${mesaId}`,
  pedidoMesa: (mesaId: string) => `autopedido:pedido-mesa:${mesaId}`,
  carrito: (mesaId: string) => `autopedido:carrito:${mesaId}`,
  envioPendiente: (mesaId: string) => `autopedido:envio-pendiente:${mesaId}`,
}

// Un error de red (sin internet, servidor inalcanzable) se reintenta solo;
// uno de negocio (la mesa no está disponible, plato inválido) no.
export function esErrorDeRed(e: unknown) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  const texto = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String(e.message) : String(e)
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(texto)
}
