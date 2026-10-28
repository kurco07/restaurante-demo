import { createContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../controllers/auth/useAuth'
import { usePowerSyncWatch } from '../../controllers/usePowerSyncWatch'
import { useAplicarMarca } from '../../controllers/marca/useAplicarMarca'
import { fetchMarcaPropia } from '../../models/services/marcaService'
import { fetchModulosActivos, type ModuloOpcional } from '../../models/services/modulosService'
import type { Usuario } from '../../models/types/usuario'
import type { Marca } from '../../models/types/marca'

interface UsuarioContextValue {
  usuario: Usuario | null
  loading: boolean
  error: string | null
  // null = todavía no se sabe (recién logueado, o sin red) — se trata
  // como "todo disponible" para no bloquear por accidente mientras carga
  // u offline (mesoneros/cocina no pueden depender de esto — CLAUDE.md).
  modulosActivos: Set<ModuloOpcional> | null
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

  // La marca no es parte del camino offline crítico (mesonero/cocina/mesas
  // — CLAUDE.md): es cosmética, así que un simple fetch por red basta;
  // useAplicarMarca ya se encarga de no parpadear entre recargas gracias
  // al caché en localStorage.
  const [marca, setMarca] = useState<Marca | null | undefined>(undefined)
  useEffect(() => {
    if (!usuario) return
    fetchMarcaPropia()
      .then(setMarca)
      .catch(() => setMarca(null))
  }, [usuario?.tenant_id])
  useAplicarMarca(marca)

  // Mismo criterio que la marca: no es parte del camino offline crítico,
  // así que un fetch simple basta. Mientras no resuelva (o si falla), se
  // queda en null — ProtectedRoute lo trata como "no bloquear todavía".
  const [modulosActivos, setModulosActivos] = useState<Set<ModuloOpcional> | null>(null)
  useEffect(() => {
    if (!usuario) return
    fetchModulosActivos()
      .then(setModulosActivos)
      .catch(() => setModulosActivos(null))
  }, [usuario?.tenant_id])

  return (
    <UsuarioContext.Provider value={{ usuario, loading, error: null, modulosActivos }}>
      {children}
    </UsuarioContext.Provider>
  )
}
