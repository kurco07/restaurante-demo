import { useSyncExternalStore } from 'react'
import { mensajeDeError } from '../../lib/errores'

// Aviso estándar de error y de éxito (Fase 8, Módulo 2). Es un almacén
// fuera de React para que también lo use código que no es un componente
// (por ejemplo el conector de PowerSync cuando el servidor rechaza un
// cambio). Se dibuja una sola vez, en <Avisos /> (App.tsx).

export type TipoAviso = 'error' | 'exito' | 'info'

export interface Aviso {
  id: number
  tipo: TipoAviso
  texto: string
  // Un aviso fijo no se va solo: hay que cerrarlo (lo que el usuario no
  // puede perderse, como un cambio que el servidor no aceptó)
  fijo: boolean
}

const DURACION_MS = { error: 7000, exito: 3500, info: 5000 }
const MAXIMO = 4

let avisos: Aviso[] = []
let siguienteId = 1
const oyentes = new Set<() => void>()

function emitir() {
  for (const o of oyentes) o()
}

export function cerrarAviso(id: number) {
  avisos = avisos.filter((a) => a.id !== id)
  emitir()
}

function agregar(tipo: TipoAviso, texto: string, fijo = false) {
  // El mismo texto repetido (p. ej. un botón tocado varias veces sin red)
  // no se apila
  if (avisos.some((a) => a.tipo === tipo && a.texto === texto)) return
  const aviso: Aviso = { id: siguienteId++, tipo, texto, fijo }
  avisos = [...avisos, aviso].slice(-MAXIMO)
  emitir()
  if (!fijo) setTimeout(() => cerrarAviso(aviso.id), DURACION_MS[tipo])
}

export const avisar = {
  // Acepta el error tal cual llegó; se traduce con mensajeDeError.
  // "contexto" va antes del motivo: "No se pudo enviar a cocina: …"
  error(e: unknown, contexto?: string, opciones?: { fijo?: boolean }) {
    const motivo = typeof e === 'string' ? e : mensajeDeError(e)
    agregar('error', contexto ? `${contexto}: ${motivo}` : motivo, opciones?.fijo)
  },
  exito(texto: string) {
    agregar('exito', texto)
  },
  info(texto: string, opciones?: { fijo?: boolean }) {
    agregar('info', texto, opciones?.fijo)
  },
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function useAvisos(): Aviso[] {
  return useSyncExternalStore(suscribir, () => avisos)
}
