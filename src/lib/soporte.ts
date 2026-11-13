// Contactos de soporte del piloto (Fase 8, Módulo 4, docs/Plan_Piloto_Roof.md).
// El botón "Ayuda" abre un WhatsApp con ellos. Para cambiarlos (por
// ejemplo, por otra persona del equipo), basta con editar esta lista.
// Teléfono en formato internacional, solo dígitos: 58 + código + número.
export interface ContactoSoporte {
  nombre: string
  telefono: string
}

export const CONTACTOS_SOPORTE: ContactoSoporte[] = [
  { nombre: 'Pedro', telefono: '584249527732' },
  { nombre: 'César', telefono: '58410884122' },
]

// Enlace de WhatsApp con el mensaje ya escrito (funciona en el celular, con
// la app, y en la computadora, con WhatsApp Web)
export function enlaceWhatsApp(telefono: string, mensaje: string) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
}
