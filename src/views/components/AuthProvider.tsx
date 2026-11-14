import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { mensajeDeError } from '../../lib/errores'
import { supabase } from '../../lib/supabaseClient'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Copia propia de la sesión, separada de la que ya persiste el SDK de
// Supabase: cuando el token de acceso ya expiró de verdad (no solo "cerca
// de expirar"), getSession() intenta renovarlo, la renovación falla por
// falta de red, y el SDK trata la sesión como inválida — aunque la única
// razón real sea "no hay internet para confirmarlo", no que el usuario
// haya cerrado sesión. Reproducido en vivo: recargar la página offline
// con el token ya vencido mandaba derecho a /login sin dejar entrar.
// Mesoneros, cocina y mesas deben seguir funcionando sin internet
// (CLAUDE.md) — un dispositivo del restaurante que ya inició sesión una
// vez debe poder seguir actuando como ese usuario mientras está offline,
// hasta que vuelva la conexión y el SDK reconcilie la sesión real.
const CLAVE_CACHE = 'beta-restaurant-sesion-offline'

// Un solo dispositivo conectado a la vez (decisión del dueño,
// 2026-11-14): este es el token que generó ESTE dispositivo en su
// último inicio de sesión. UsuarioProvider.tsx lo compara contra
// usuarios.sesion_token (sincronizado por PowerSync) — si otro
// dispositivo inició sesión después, los tokens dejan de coincidir y
// este se cierra solo.
const CLAVE_MI_SESION = 'beta-restaurant-mi-sesion'

function guardarCache(session: Session) {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(session))
  } catch {
    // Almacenamiento lleno o no disponible — se pierde la resiliencia
    // offline pero no rompe nada mientras hay conexión.
  }
}

function leerCache(): Session | null {
  try {
    const guardada = localStorage.getItem(CLAVE_CACHE)
    return guardada ? (JSON.parse(guardada) as Session) : null
  } catch {
    return null
  }
}

function borrarCache() {
  try {
    localStorage.removeItem(CLAVE_CACHE)
  } catch {
    // no-op
  }
}

// Sin red, un fetch() puede tardar mucho en fallar de verdad (sobre todo
// en datos móviles con señal débil, en vez de wifi apagado) — no basta con
// el truco de "usar la caché si getSession() devuelve null", porque en los
// hechos ni siquiera llega a resolver rápido. Reproducido en vivo: la
// pantalla se quedaba en "Cargando sesión…" varios minutos en vez de caer
// al respaldo. Se le pone un límite de tiempo explícito: si no responde en
// ese plazo, se asume sin red y se usa la última sesión válida conocida.
const LIMITE_MS = 4000

function conLimiteDeTiempo<T>(promesa: Promise<T>, ms: number): Promise<T | 'tiempo-agotado'> {
  return new Promise((resolve) => {
    const id = setTimeout(() => resolve('tiempo-agotado'), ms)
    promesa.then(
      (valor) => {
        clearTimeout(id)
        resolve(valor)
      },
      () => {
        clearTimeout(id)
        resolve('tiempo-agotado')
      },
    )
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    conLimiteDeTiempo(supabase.auth.getSession(), LIMITE_MS).then((resultado) => {
      if (resultado === 'tiempo-agotado') {
        setSession(leerCache())
      } else if (resultado.data.session) {
        setSession(resultado.data.session)
        guardarCache(resultado.data.session)
      } else if (!navigator.onLine) {
        setSession(leerCache())
      } else {
        setSession(null)
        borrarCache()
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') {
        borrarCache()
        setSession(null)
        return
      }
      if (newSession) {
        guardarCache(newSession)
        setSession(newSession)
        return
      }
      // newSession nula sin ser un cierre de sesión explícito (ej. una
      // renovación automática en segundo plano que falló) — offline no
      // se trata como cierre de sesión real.
      setSession(!navigator.onLine ? leerCache() : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: mensajeDeError(error, 'No se pudo iniciar sesión. Intenta de nuevo.') }

    // Toma este dispositivo como el único activo — cualquier otro con
    // sesión abierta antes se cierra solo apenas sincronice el cambio.
    // No bloquea el login si falla: es un efecto secundario, no la
    // autenticación en sí.
    try {
      const miToken = crypto.randomUUID()
      const { error: errorToken } = await supabase.rpc('actualizar_mi_sesion', { p_token: miToken })
      if (!errorToken) localStorage.setItem(CLAVE_MI_SESION, miToken)
    } catch {
      // sin red justo después del login, u otro fallo no crítico
    }

    return { error: null }
  }

  const signOut = async () => {
    // Se borra la caché local primero: "cerrar sesión" debe funcionar de
    // verdad aunque el dispositivo esté offline en ese momento, aunque la
    // llamada al servidor de Supabase (que invalida el refresh token del
    // lado del servidor) no pueda completarse sin conexión.
    borrarCache()
    localStorage.removeItem(CLAVE_MI_SESION)
    await supabase.auth.signOut()
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
