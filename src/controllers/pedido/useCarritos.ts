import { useContext } from 'react'
import { CarritoContext } from './carritoContext'

export function useCarritos() {
  const context = useContext(CarritoContext)
  if (!context) {
    throw new Error('useCarritos debe usarse dentro de un <CarritoProvider>')
  }
  return context
}
