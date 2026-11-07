// Fase 7, Módulo 4 — personalización de marca (tabla personalizacion_marca).
// Ampliada en la Ronda 1 de personalización completa: color_acento,
// fuente y marca de agua (reutiliza logo_url, sin imagen aparte).
export interface Marca {
  logo_url: string | null
  color_primario: string | null
  color_secundario: string | null
  color_acento: string | null
  // Ronda 1 (ajuste): color de la barra lateral de Administración/Gerencia
  // — null = se queda con el marrón oscuro por defecto de la plataforma.
  color_sidebar: string | null
  fuente: string | null
  marca_agua_activa: boolean
  marca_agua_opacidad: number
  marca_agua_tamano: number
  nombre_mostrado: string | null
  // Ronda 2 de personalización completa: acceso directo a redes desde la
  // vitrina pública (InicioPage.tsx). Todos opcionales — null = no se
  // muestra ese botón.
  red_instagram: string | null
  red_whatsapp: string | null
  red_facebook: string | null
  red_enlace_libre: string | null
  red_enlace_libre_etiqueta: string | null
}

// Subconjunto que devuelven las RPC públicas (menu_publico_tenant/
// menu_publico_mesa, sin sesión) — no incluyen nombre_mostrado porque ya
// va aparte en 'restaurante'. Los campos red_* son opcionales porque solo
// menu_publico_tenant los devuelve (la vitrina) — menu_publico_mesa
// (autopedido, ya en el restaurante pidiendo) no los necesita.
export interface MarcaPublica {
  logo_url: string | null
  color_primario: string | null
  color_secundario: string | null
  color_acento: string | null
  fuente: string | null
  marca_agua_activa: boolean
  marca_agua_opacidad: number
  marca_agua_tamano: number
  red_instagram?: string | null
  red_whatsapp?: string | null
  red_facebook?: string | null
  red_enlace_libre?: string | null
  red_enlace_libre_etiqueta?: string | null
}
