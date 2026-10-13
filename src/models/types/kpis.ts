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
