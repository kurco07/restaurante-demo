import { createContext, type ReactNode } from 'react'
import { useAuth } from '../../controllers/auth/useAuth'
import { usePowerSyncWatch } from '../../controllers/usePowerSyncWatch'
import type { Usuario } from '../../models/types/usuario'

interface UsuarioContextValue {
  usuario: Usuario | null
  loading: boolean
  error: string | null
}

export const UsuarioContext = createContext<UsuarioContextValue | undefined>(undefined)

// Lee el perfil (tenant_id, sede_id, rol...) de la base local de PowerSync
// en vez de pedirlo por red a Supabase — usuarios ya es una de las tablas
// que se sincronizan offline (powerSyncClient.ts), así que esto es lo que
// permite que mesonero/cocina puedan recargar la página sin internet y
// seguir logueados, en vez de quedarse "cargando" o caer a /login por un
// fetch que nunca puede completar sin conexión (CLAUDE.md: estos módulos
// deben seguir funcionando sin internet).
export function UsuarioProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()

  const filas = usePowerSyncWatch<Usuario>('select * from usuarios where id = ?', [user?.id ?? ''])
  const usuario = filas[0] ?? null

  // "Cargando" solo mientras se resuelve el login en sí (authLoading) o
  // justo después de loguearse, antes de que llegue la primera sincronización
  // de PowerSync con la fila propia — no en cada re-render posterior.
  const loading = authLoading || (!!user && filas.length === 0)

  return (
    <UsuarioContext.Provider value={{ usuario, loading, error: null }}>
      {children}
    </UsuarioContext.Provider>
  )
}
