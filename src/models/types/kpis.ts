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
}
