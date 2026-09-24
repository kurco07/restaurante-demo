export interface IngredienteReceta {
  nombre: string
  disponible: boolean
}

// Ingredientes tomados directo de las descripciones reales del menú
// (docs/Menu.md) — sin cantidades porque el documento del cliente no las
// trae. `disponible` es mock (para mostrar cómo se vería un faltante de
// inventario) — cuando exista la receta real y el inventario conectado
// (Fase 4), esto se reemplaza por datos de Supabase.
function ingredientes(nombres: string[], faltantes: string[] = []): IngredienteReceta[] {
  return nombres.map((nombre) => ({ nombre, disponible: !faltantes.includes(nombre) }))
}

export const recetasMock: Record<string, IngredienteReceta[]> = {
  'Cheese burger': ingredientes([
    'Doble carne tipo smash',
    'Doble topping de tocineta',
    'Queso Kraft',
    'Meyoroof',
    '¼ ración de papas',
  ]),
  '2/4 de Roof': ingredientes(['Doble carne tipo smash', 'Queso Kraft', 'Cebolla', 'Pepinillos', 'Salsas tradicionales', '¼ ración de papas']),
  Ahumadita: ingredientes(
    [
      'Chuleta ahumada',
      'Huevo',
      'Trozos de tocineta',
      'Jamón',
      'Mozzarella gratinado',
      'Lechuga',
      'Tomate',
      'Cebolla',
      'Maíz',
      'Papitas de hilo',
      'Salsas tradicionales',
      'Crema de ajo',
      'Salsa de queso',
    ],
    ['Chuleta ahumada'],
  ),
  'César crispy': ingredientes([
    'Súper pieza de pollo crispy',
    'Trozos de tocineta',
    'Trozos de jamón',
    'Queso amarillo',
    'Lechuga',
    'Parmesano',
    'Maíz',
    'Aderezo Roof',
    'Meyoroof',
    'Queso cheddar fundido',
  ]),
  Triroof: ingredientes(
    [
      'Carne',
      'Pollo a la plancha',
      'Chuleta ahumada',
      'Huevo',
      'Trozos de tocineta',
      'Jamón',
      'Queso amarillo',
      'Mozzarella gratinado',
      'Lechuga',
      'Tomate',
      'Cebolla',
      'Maíz',
      'Papitas de hilo',
      'Salsas tradicionales',
      'Crema de ajo',
      'Salsa de queso',
      '¼ ración de papas',
    ],
    ['Chuleta ahumada'],
  ),
  'Ración de papas': ingredientes(['Papas fritas', 'Salsa de tomate']),
  Pepiroof: ingredientes([
    'Pan grande especial',
    'Carne',
    'Pollo',
    'Trozos de tocineta',
    'Huevo',
    'Jamón',
    'Queso crispy',
    'Queso amarillo',
    'Lechuga',
    'Tomate',
    'Cebolla',
    'Papitas de hilo',
    'Meyoroof',
    'Crema de ajo',
    'Salsa de queso',
  ]),
  Salchipapas: ingredientes(['Papas fritas', 'Salchichas', 'Queso amarillo', 'Meyoroof', 'Salsa de tomate']),
}
