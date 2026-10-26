// Respuesta de la Edge Function ia-probar (Fase 6, Módulo 1)
export type ResultadoPruebaIA =
  | { ok: true; proveedor: string; modelo: string; milisegundos: number; respuesta: string }
  | { ok: false; codigo?: string; mensaje: string; milisegundos?: number; modelosDisponibles?: string[] }
