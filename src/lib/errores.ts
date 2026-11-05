// Traductor común de errores (Fase 8, Módulo 2): lo que llega de Supabase,
// de PowerSync o del navegador se convierte en una frase para el usuario.
// Los mensajes de nuestras propias reglas (triggers y funciones con
// "raise exception", códigos P0001 y 42501) ya están escritos en español
// para el usuario y se muestran tal cual; los técnicos de Postgres o de
// la red nunca llegan crudos a la pantalla.

interface ErrorConCodigo {
  code?: string
  message?: string
  details?: string
}

function texto(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  if (typeof e === 'object' && e && 'message' in e) return String((e as ErrorConCodigo).message ?? '')
  return ''
}

function codigo(e: unknown): string | undefined {
  if (typeof e === 'object' && e && 'code' in e) return String((e as ErrorConCodigo).code ?? '') || undefined
  return undefined
}

// Sin internet o servidor inalcanzable
export function esErrorDeRed(e: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(texto(e))
}

// Mensaje técnico en inglés de Postgres o PostgREST: no se muestra
const TECNICO =
  /violates|duplicate key|row-level security|permission denied|syntax|relation |column |constraint|invalid input|JWT|PGRST|null value|foreign key|function .* does not exist|timeout|internal server error/i

// enUso: qué decir si no se puede borrar porque otros registros dependen
// de este (código 23503). Cada pantalla de borrar lo explica a su manera:
// "este plato ya tiene pedidos…" dice más que un mensaje general.
export function mensajeDeError(
  e: unknown,
  porDefecto = 'Algo salió mal. Intenta de nuevo.',
  opciones?: { enUso?: string },
): string {
  if (esErrorDeRed(e)) return 'Sin conexión: revisa el internet e intenta de nuevo.'

  const msg = texto(e).trim()
  const cod = codigo(e)

  switch (cod) {
    case '23505':
      return 'Ya existe un registro con ese nombre o dato. Usa otro.'
    case '23503':
      return opciones?.enUso ?? 'No se puede: hay otros registros que dependen de este.'
    case '23502':
      return 'Falta completar un dato obligatorio.'
    case '23514':
      return 'Algún dato no es válido. Revisa los valores e intenta de nuevo.'
    case '22P02':
      return 'Algún dato tiene un formato no válido.'
    case 'PGRST116':
      return 'No se encontró lo que buscabas: puede que se haya borrado.'
    case 'PGRST301':
      return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  }

  if (/row-level security|permission denied/i.test(msg) || (cod === '42501' && TECNICO.test(msg))) {
    return 'No tienes permiso para hacer esto.'
  }
  if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.'
  if (/email not confirmed/i.test(msg)) return 'Falta confirmar el correo.'
  if (/jwt expired|refresh token/i.test(msg)) return 'Tu sesión expiró. Vuelve a iniciar sesión.'

  // Nuestras reglas (P0001, 42501 propios) y cualquier otro mensaje que no
  // sea técnico ya están pensados para el usuario
  if (msg && !TECNICO.test(msg)) return msg

  return porDefecto
}
