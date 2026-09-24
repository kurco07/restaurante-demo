import type { ItemCarrito } from '../../../models/types'

export function crearPedidosPrueba(): ItemCarrito[] {
  return [
    {
      id: 'mock-1',
      menuItemId: 'burger',
      nombre: 'Hamburguesa doble clásica',
      cantidad: 2,
      precioBase: 8.50,
      extras: [{ nombre: 'Queso extra', precio: 0.50 }],
      proteinaSeleccionada: 'Carne de res',
      ingredientesQuitados: ['Cebolla'],
      nota: 'Sin cebolla en una',
      precioTotal: 17.00,
      agregadoPor: 'Agregado por Valentina',
    },
    {
      id: 'mock-2',
      menuItemId: 'papas',
      nombre: 'Papas cheddar bacon',
      cantidad: 1,
      precioBase: 6.00,
      extras: [],
      ingredientesQuitados: [],
      nota: '',
      precioTotal: 6.00,
      agregadoPor: 'Autopedido · cliente',
    },
    {
      id: 'mock-3',
      menuItemId: 'pizza',
      nombre: 'Pizza pepperoni familiar',
      cantidad: 1,
      precioBase: 12.00,
      extras: [],
      ingredientesQuitados: [],
      nota: '',
      precioTotal: 12.00,
      agregadoPor: 'Agregado por Valentina',
    },
    {
      id: 'mock-4',
      menuItemId: 'gaseosa',
      nombre: 'Gaseosa',
      cantidad: 2,
      precioBase: 2.50,
      extras: [],
      ingredientesQuitados: [],
      nota: '',
      precioTotal: 5.00,
      agregadoPor: 'Autopedido · cliente',
    },
  ]
}

export const NOTA_GENERAL_PRUEBA = 'Cliente celebra cumpleaños — llevar postre con vela'

export function crearMesasActivas(mesaActual: number): Array<{ numero: number; tiempo: string; estado: string }> {
  return [
    { numero: mesaActual, tiempo: 'actual', estado: 'actual' },
    { numero: 7, tiempo: '18 min', estado: 'cocina' },
    { numero: 9, tiempo: 'cuenta pedida', estado: 'cuenta' },
    { numero: 3, tiempo: 'listo', estado: 'listo' },
    { numero: 2, tiempo: '12 min', estado: 'cocina' },
  ]
}