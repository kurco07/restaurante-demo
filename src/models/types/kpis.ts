// Forma de lo que devuelve la función kpis_ventas (migración 0010).
// Los montos llegan como number (numeric de Postgres serializado en jsonb).

export interface ResumenVentas {
  ventas: number
  propinas: number
  cuentas: number
  ticket_promedio: number
}

export interface VentaPorDia {
  dia: string // 'YYYY-MM-DD' en la zona horaria de la sede
  ventas: number
  cuentas: number
}

export interface VentaPorHora {
  hora: number // 0–23 en la zona horaria de la sede
  ventas: number
  cuentas: number
}

export interface VentaPorMetodo {
  metodo: string
  ventas: number
  cuentas: number
}

export interface VentaPorMesonero {
  mesonero: string
  ventas: number
  cuentas: number
}

export interface PlatoVendido {
  plato: string
  cantidad: number
  importe: number
}

export interface CategoriaVendida {
  categoria: string
  cantidad: number
  importe: number
}

export interface KpisVentas {
  resumen: ResumenVentas
  por_dia: VentaPorDia[]
  por_hora: VentaPorHora[]
  por_metodo: VentaPorMetodo[]
  por_mesonero: VentaPorMesonero[]
  top_platos: PlatoVendido[]
  por_categoria: CategoriaVendida[]
}

// Una fila de kpis_inventario (migración 0011): rotación de un insumo en
// el período, en sus propias unidades (no hay costo de insumos).
export interface RotacionInsumo {
  insumo_id: string
  insumo: string
  unidad: string
  consumo: number
  merma: number
  entradas: number
  stock_actual: number
  stock_minimo: number | null
  stock_promedio: number
  rotacion: number | null
  dias_alcanza: number | null
  // Costo de la última compra recibida (migración 0012); null si el insumo
  // nunca se compró.
  costo_unitario: number | null
  valor_stock: number | null
}

// Una fila de kpis_rentabilidad (migración 0012): un plato vendido en el
// período. El costo sale de su receta × la última compra recibida de cada
// insumo. Margen y ganancia solo cuando el costo está completo ('ok').
export type EstadoCostoPlato = 'ok' | 'incompleto' | 'sin_receta'

export interface RentabilidadPlato {
  menu_item_id: string
  plato: string
  vendidos: number
  importe: number
  precio_promedio: number
  costo_unitario: number | null
  estado: EstadoCostoPlato
  margen_unitario: number | null
  margen_pct: number | null
  ganancia: number | null
}

// Un ingrediente de la receta de un plato, con el costo que usa la
// rentabilidad (última compra recibida). costo_unitario null = el insumo
// nunca se compró, así que su subtotal tampoco se conoce.
export interface IngredienteCosteado {
  insumo_id: string
  insumo: string
  cantidad: number
  unidad: string
  costo_unitario: number | null
  subtotal: number | null
}
