import type { ItemPedidoMesa, PlatoAutopedido } from '../../../models/types'

// Datos de ejemplo (mockup-autopedido-v3.html) hasta conectar el flujo real
// de autopedido (Fase 3: RPC/Edge Function que valida el QR de la mesa).

export const nombreRestaurante = 'Fast & Co.'
export const mesaEjemplo = 9

export const categoriasAutopedido = ['Populares', 'Hamburguesas', 'Pizzas', 'Pollo']

export const platosAutopedido: PlatoAutopedido[] = [
  {
    id: 'burger', nombre: 'Hamburguesa doble clásica', precio: 8.5, categoria: 'Hamburguesas',
    descripcion: 'Doble carne · queso cheddar · salsa especial', gradiente: 'from-[#ffb877] to-[#ff7a1a]',
    proteinas: ['Carne de res', 'Pollo'],
    quitables: ['Cebolla', 'Tomate', 'Queso cheddar', 'Lechuga', 'Pepinillos'],
    extras: [
      { nombre: 'Tocineta extra', precio: 1 },
      { nombre: 'Queso extra', precio: 0.5 },
      { nombre: 'Aguacate', precio: 1 },
    ],
  },
  {
    id: 'pizza', nombre: 'Pizza pepperoni familiar', precio: 12, categoria: 'Pizzas',
    descripcion: 'Masa artesanal · doble pepperoni · orégano', gradiente: 'from-[#ffcf6b] to-[#f5a623]',
    extras: [
      { nombre: 'Queso extra', precio: 1.5 },
      { nombre: 'Champiñones', precio: 1 },
    ],
  },
  {
    id: 'papas', nombre: 'Papas cheddar bacon', precio: 6, categoria: 'Populares',
    descripcion: 'Papas fritas · queso cheddar · bacon crocante', gradiente: 'from-[#ffdca0] to-[#ffb04a]',
    quitables: ['Tocineta', 'Queso cheddar'],
    extras: [{ nombre: 'Tocineta extra', precio: 1 }],
  },
  {
    id: 'wrap', nombre: 'Wrap de pollo crispy', precio: 7.5, categoria: 'Pollo',
    descripcion: 'Pollo crocante · lechuga · salsa de la casa', gradiente: 'from-[#ff8f6b] to-[#e14434]',
    quitables: ['Lechuga', 'Salsa de la casa', 'Tomate'],
    extras: [{ nombre: 'Queso extra', precio: 0.5 }],
  },
]

export const pedidoInicialMesa: ItemPedidoMesa[] = [
  { id: 'i1', nombre: 'Hamburguesa doble clásica', cantidad: 1, modificaciones: ['Sin cebolla', '+Tocineta extra'], agregadoPor: 'Agregado por Valentina', precioTotal: 9.5 },
  { id: 'i2', nombre: 'Papas cheddar bacon', cantidad: 1, modificaciones: [], agregadoPor: 'Autopedido · tú', precioTotal: 6 },
]
