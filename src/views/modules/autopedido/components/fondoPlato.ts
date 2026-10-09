import { FOTO_POR_DEFECTO, GRADIENTES_FOTO } from '../../pedidos/components/constants'

// Mismo criterio visual que la tarjeta de plato del mesonero (PlatoCard),
// para que cliente y mesonero vean el mismo plato igual.
export function fondoPlato(imagenUrl: string | null) {
  return GRADIENTES_FOTO[imagenUrl?.split('/').pop()?.split('.')[0] || ''] || FOTO_POR_DEFECTO
}
