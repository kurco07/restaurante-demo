import { createContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../controllers/auth/useAuth'
import { usePowerSyncWatch } from '../../controllers/usePowerSyncWatch'
import { useAplicarMarca } from '../../controllers/marca/useAplicarMarca'
import { fetchMarcaPropia } from '../../models/services/marcaService'
import { fetchModulosActivos, type ModuloOpcional } from '../../models/services/modulosService'
import { avisar } from '../../controllers/avisos/avisos'
import type { Usuario } from '../../models/types/usuario'
import type { Marca } from '../../models/types/marca'

const CLAVE_MI_SESION = 'beta-restaurant-mi-sesion'

interface UsuarioContextValue {
  usuario: Usuario | null
  loading: boolean
  error: string | null
  // null = todavía no se sabe (recién logueado, o sin red) — se trata
  // como "todo disponible" para no bloquear por accidente mientras carga
  // u offline (mesoneros/cocina no pueden depender de esto — CLAUDE.md).
  modulosActivos: Set<ModuloOpcional> | null
}

// Cuánto se espera la fila del perfil antes de avisar que algo anda mal
const ESPERA_PERFIL_MS = 15_000

export const UsuarioContext = createContext<UsuarioContextValue | undefined>(undefined)

// Lee el perfil (tenant_id, sede_id, rol...) de la base local de PowerSync
// en vez de pedirlo por red a Supabase — usuarios ya es una de las tablas
// que se sincronizan offline (powerSyncClient.ts), así que esto es lo que
// permite que mesonero/cocina puedan recargar la página sin internet y
// seguir logueados, en vez de quedarse "cargando" o caer a /login por un
// fetch que nunca puede completar sin conexión (CLAUDE.md: estos módulos
// deben seguir funcionando sin internet).
export function UsuarioProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth()

  const filas = usePowerSyncWatch<Usuario>('select * from usuarios where id = ?', [user?.id ?? ''])
  const usuario = filas[0] ?? null

  // Un solo dispositivo conectado a la vez: si otro inició sesión después
  // que este, usuarios.sesion_token (sincronizado por PowerSync) ya no
  // coincide con el token que este dispositivo guardó en el login — se
  // cierra solo. Sin red, este dispositivo no se entera hasta que vuelva
  // a sincronizar: misma limitación que cualquier bloqueo de cuenta
  // offline-first (no hay forma de avisarle a algo que no está conectado).
  useEffect(() => {
    if (!usuario?.sesion_token) return
    const miToken = localStorage.getItem(CLAVE_MI_SESION)
    if (miToken && miToken !== usuario.sesion_token) {
      avisar.info('Tu cuenta se inició en otro dispositivo — por seguridad, se cerró esta sesión.', { fijo: true })
      void signOut()
    }
  }, [usuario?.sesion_token, signOut])

  // "Cargando" solo mientras se resuelve el login en sí (authLoading) o
  // justo después de loguearse, antes de que llegue la primera sincronización
  // de PowerSync con la fila propia — no en cada re-render posterior.
  const loading = authLoading || (!!user && filas.length === 0)

  // Si el perfil no llega nunca a la copia local (sin internet en un
  // dispositivo que nunca sincronizó, o la copia de PowerSync trabada), se
  // deja de esperar y se avisa (Fase 8, Módulo 2): ProtectedRoute muestra
  // PerfilNoCargado con "Reiniciar datos de este dispositivo".
  const esperandoPerfil = !!user && filas.length === 0
  const [tardo, setTardo] = useState(false)
  useEffect(() => {
    setTardo(false)
    if (!esperandoPerfil) return
    const t = setTimeout(() => setTardo(true), ESPERA_PERFIL_MS)
    return () => clearTimeout(t)
  }, [esperandoPerfil])
  const error = esperandoPerfil && tardo ? 'No se pudo cargar tu perfil en este dispositivo.' : null

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
    <UsuarioContext.Provider value={{ usuario, loading, error, modulosActivos }}>
      {children}
    </UsuarioContext.Provider>
  )
}
