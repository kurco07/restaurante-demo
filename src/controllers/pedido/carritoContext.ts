import { createContext } from 'react'
import type { ItemCarrito } from '../../models/types'

// Clave del borrador que todavía no tiene mesa (flujo "menú primero").
export const SIN_MESA = 'sin_mesa'

// Un borrador por mesa (o SIN_MESA), así ir de una mesa a otra no mezcla
// los platos y cada una conserva lo anotado hasta enviarlo a cocina.
export type Borradores = Record<string, ItemCarrito[]>

export interface CarritoContextValue {
  borradores: Borradores
  itemsDe: (clave: string) => ItemCarrito[]
  agregar: (clave: string, item: ItemCarrito) => void
  cambiarCantidad: (clave: string, itemId: string, delta: number) => void
  quitar: (clave: string, itemId: string) => void
  vaciar: (clave: string) => void
  // "Cambiar mesa": pasa el borrador de una clave a otra; si la mesa
  // destino ya tenía platos anotados, se suman.
  mover: (desde: string, hacia: string) => void
  // Platos anotados sin enviar, en todos los borradores
  totalPlatos: number
}

export const CarritoContext = createContext<CarritoContextValue | null>(null)
