// ============================================================
// Fase 6, Módulo 1 — Capa adaptadora de proveedor de IA
// ============================================================
// El resto del sistema habla con esta interfaz, nunca con un proveedor
// concreto: cambiar Gemini por otro modelo (arquitectura.md §4.5) es
// escribir otro adaptador y cambiar IA_PROVEEDOR, sin tocar las
// funciones de sugerencias.
//
// Reglas que valen para cualquier proveedor (decisiones de Pedro,
// 2026-10-26):
// - Corre solo en el servidor (Edge Functions de Supabase): la clave de
//   la API nunca llega al navegador.
// - Al modelo se le mandan solo resúmenes con cifras (consumo por
//   insumo, ventas por plato, stock), NUNCA nombres de personas ni datos
//   de clientes: el nivel gratuito de Gemini puede usar lo que recibe
//   para mejorar sus productos.
// - Lo que devuelve el modelo es una SUGERENCIA: se guarda en
//   sugerencias_ia como 'pendiente' y no se ejecuta hasta que una
//   persona la apruebe (CLAUDE.md).
//
// Sin dependencias ni APIs propias de Deno, para poder probarlo con
// Node (ver ia.test.ts).

// Esquema de la respuesta, en el subconjunto de JSON Schema que entienden
// todos los proveedores: type, properties, required, items, enum,
// description. Cada adaptador lo traduce a su formato.
export interface EsquemaJSON {
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean'
  description?: string
  properties?: Record<string, EsquemaJSON>
  required?: string[]
  items?: EsquemaJSON
  enum?: string[]
}

export interface PeticionIA {
  // Rol y reglas del modelo (qué es, qué puede y qué no puede proponer)
  instrucciones: string
  // Los datos del caso y lo que se le pide
  mensaje: string
  // Forma exacta del JSON que tiene que devolver
  esquema: EsquemaJSON
  // 0 = respuestas estables; para sugerencias conviene bajo
  temperatura?: number
}

export interface RespuestaIA<T> {
  datos: T
  proveedor: string
  modelo: string
  tokensEntrada: number | null
  tokensSalida: number | null
}

export interface ProveedorIA {
  nombre: string
  modelo: string
  generarJSON<T>(peticion: PeticionIA): Promise<RespuestaIA<T>>
  // Modelos que la clave configurada puede usar para generar texto. Sirve
  // para diagnosticar 'modelo_no_encontrado' sin que nadie vea la clave.
  listarModelos(): Promise<string[]>
}

export type CodigoErrorIA =
  | 'no_configurada' // falta la clave o el proveedor no existe
  | 'clave_invalida'
  | 'modelo_no_encontrado'
  | 'cuota_agotada' // límite del nivel gratuito
  | 'bloqueada' // el proveedor rechazó la petición o la respuesta
  | 'respuesta_invalida' // no devolvió JSON
  | 'sin_conexion' // no se pudo llegar al proveedor
  | 'tiempo_agotado' // llegó, pero no respondió a tiempo
  | 'desconocido'

// Error común a todos los adaptadores, con un mensaje en español que se
// puede mostrar tal cual en la pantalla
export class ErrorIA extends Error {
  codigo: CodigoErrorIA

  constructor(codigo: CodigoErrorIA, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorIA'
    this.codigo = codigo
  }
}
