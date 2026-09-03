import { createContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import type { Usuario } from '../types/usuario'

interface UsuarioContextValue {
  usuario: Usuario | null
  loading: boolean
  error: string | null
}

export const UsuarioContext = createContext<UsuarioContextValue | undefined>(undefined)

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setUsuario(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setUsuario(null)
          setError(error.message)
        } else {
          setUsuario(data as Usuario)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  return (
    <UsuarioContext.Provider value={{ usuario, loading, error }}>
      {children}
    </UsuarioContext.Provider>
  )
}
