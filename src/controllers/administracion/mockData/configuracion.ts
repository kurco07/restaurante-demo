import type { ColorMarca, DatosRestaurante, Facturacion, PreferenciaNotificacion } from '../../../models/types'

// Datos de ejemplo (mockup-admin-configuracion.html) hasta conectar Supabase.

export const datosRestaurante: DatosRestaurante = {
  nombre: 'Fast & Co.',
  direccion: 'Av. Principal, Local 4, Caracas',
  telefono: '0212-555-0100',
  horario: 'Lun–Dom, 11:00 a.m. – 11:00 p.m.',
}

export const facturacion: Facturacion = {
  moneda: 'USD ($)',
  impuesto: 16,
  propinaSugerida: 10,
}

export const metodosPago = ['Efectivo', 'Tarjeta', 'Pago móvil', 'Transferencia']
export const metodosPagoActivos = ['Efectivo', 'Tarjeta', 'Pago móvil']

export const coloresMarca: ColorMarca[] = [
  { nombre: 'Naranja principal', hex: '#FF7A1A' },
  { nombre: 'Naranja oscuro', hex: '#E0650A' },
  { nombre: 'Texto principal', hex: '#2B2118' },
  { nombre: 'Fondo', hex: '#FFFBF6' },
]

export const notificaciones: PreferenciaNotificacion[] = [
  { id: 'stock-bajo', label: 'Alertas de stock bajo' },
  { id: 'pedidos-demorados', label: 'Alertas de pedidos demorados' },
  { id: 'resumen-diario', label: 'Resumen diario por correo' },
]
export const notificacionesActivas = ['stock-bajo', 'pedidos-demorados']
