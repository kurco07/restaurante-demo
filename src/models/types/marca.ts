// Fase 7, Módulo 4 — personalización de marca (tabla personalizacion_marca).
// Ampliada en la Ronda 1 de personalización completa: color_acento,
// fuente y marca de agua (reutiliza logo_url, sin imagen aparte).
export interface Marca {
  logo_url: string | null
  color_primario: string | null
  color_secundario: string | null
  color_acento: string | null
  fuente: string | null
  marca_agua_activa: boolean
  marca_agua_opacidad: number
  nombre_mostrado: string | null
}

// Subconjunto que devuelven las RPC públicas (menu_publico_tenant/
// menu_publico_mesa, sin sesión) — no incluyen nombre_mostrado porque ya
// va aparte en 'restaurante'.
export interface MarcaPublica {
  logo_url: string | null
  color_primario: string | null
  color_secundario: string | null
  color_acento: string | null
  fuente: string | null
  marca_agua_activa: boolean
  marca_agua_opacidad: number
}
