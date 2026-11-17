import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../controllers/auth/useAuth'
import { supabase } from '../../../lib/supabaseClient'
import { inicioDe } from '../../../lib/rolesPorModulo'
import { esErrorDeRed, mensajeDeError } from '../../../lib/errores'
import { infoAccesoEmpleado } from '../../../models/services/empleadoService'
import { useEnLinea } from '../../../controllers/useEnLinea'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import type { Rol } from '../../../models/types'
import { PanelMarcaAuth } from '../../components/ui/PanelMarcaAuth'
import { IconoCandado, IconoOjo, IconoOjoTachado, IconoPersona } from '../../components/ui/IconosAuth'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

// Enlace propio de cada empleado (migración 0046, decisión del dueño
// 2026-11-14): no es para administración, que sigue entrando por /login
// con su correo y contraseña. Acá el empleado no escribe correo — el
// enlace ya sabe quién es (/acceso/<su id>), solo pide la contraseña que
// le dio administración.
//
// Si la persona ya tiene la sesión abierta en este dispositivo, el enlace
// la lleva directo a su pantalla en vez de volver a pedir la contraseña
// (arreglo 2026-11-17: guardaban el enlace como acceso directo y parecía
// que la sesión no se guardaba). Funciona también sin internet, porque la
// sesión y el perfil están guardados en el dispositivo.
export default function AccesoEmpleadoPage() {
  const { usuarioId } = useParams<{ usuarioId: string }>()
  const { signIn, user, loading: authLoading } = useAuth()
  const { usuario } = useUsuario()
  const navigate = useNavigate()
  const enLinea = useEnLinea()

  // 'sin_red' = no se pudo consultar el enlace por falta de internet (no
  // es que el enlace sea inválido)
  const [info, setInfo] = useState<{ nombre: string; email: string } | null | undefined | 'sin_red'>(undefined)
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!usuarioId) return
    infoAccesoEmpleado(usuarioId)
      .then(setInfo)
      .catch((e: unknown) => setInfo(esErrorDeRed(e) ? 'sin_red' : null))
  }, [usuarioId, enLinea])

  // Ya entró antes en este dispositivo con esta misma cuenta: directo a su
  // pantalla
  const yaConectado = !!user && user.id === usuarioId
  if (yaConectado && usuario) return <Navigate to={inicioDe(usuario.rol)} replace />
  if (authLoading || (yaConectado && !usuario)) return <LoadingSpinner message="Entrando…" />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!info || info === 'sin_red') return
    setSubmitting(true)
    setError(null)

    const { error: errorLogin } = await signIn(info.email, password)
    if (errorLogin) {
      setSubmitting(false)
      setError(errorLogin)
      return
    }

    // Mismo patrón que LoginPage.tsx: se consulta el rol acá mismo, en
    // vez de esperar al UsuarioProvider del resto de la app.
    try {
      const { data: authData, error: errorUsuario } = await supabase.auth.getUser()
      if (errorUsuario || !authData.user) throw errorUsuario ?? new Error('Sin usuario')
      const { data: perfil, error: errorPerfil } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', authData.user.id)
        .maybeSingle()
      if (errorPerfil) throw errorPerfil
      if (!perfil) {
        setError('Tu cuenta no tiene un perfil en ningún restaurante. Pídele a administración que te dé acceso.')
        return
      }
      navigate(inicioDe(perfil.rol as Rol))
    } catch (e) {
      setError(mensajeDeError(e, 'Entraste, pero no se pudo cargar tu perfil. Intenta de nuevo.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <PanelMarcaAuth
        titulo="Tu acceso directo"
        descripcion="Este enlace es solo tuyo — no hace falta escribir tu correo, solo tu contraseña."
      />

      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 md:p-12 lg:p-16">
        <div className="flex w-full max-w-[400px] flex-col rounded-xl bg-white p-8 shadow-sm">
          {info === undefined ? (
            <LoadingSpinner message="Cargando…" />
          ) : info === 'sin_red' ? (
            <div className="text-center">
              <h1 className="mb-2 text-xl font-bold text-gray-900">Sin conexión</h1>
              <p className="text-sm text-gray-500">
                Para entrar la primera vez en este dispositivo hace falta internet. Conéctate y se carga solo.
              </p>
            </div>
          ) : info === null ? (
            <div className="text-center">
              <h1 className="mb-2 text-xl font-bold text-gray-900">Este enlace ya no es válido</h1>
              <p className="text-sm text-gray-500">
                Puede que te hayan dado de baja, o que el enlace esté mal escrito. Pídele a administración uno nuevo.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <IconoPersona className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">Hola, {info.nombre}</h1>
                  <p className="text-sm text-gray-500">Escribe tu contraseña para entrar</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* El usuario (oculto) para que el navegador ofrezca guardar
                    la contraseña y la complete sola la próxima vez */}
                <input
                  type="email"
                  name="username"
                  autoComplete="username"
                  value={info.email}
                  readOnly
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only"
                />
                <label className="flex flex-col gap-1.5 text-left text-sm">
                  <span className="font-medium text-gray-900">Contraseña</span>
                  <div className="relative flex items-center">
                    <IconoCandado className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-gray-400" />
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      autoFocus
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-lg bg-gray-50 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((v) => !v)}
                      aria-label="Mostrar u ocultar la contraseña"
                      className="absolute right-3 text-gray-400 hover:text-gray-700"
                    >
                      {mostrarPassword ? <IconoOjoTachado /> : <IconoOjo />}
                    </button>
                  </div>
                </label>

                {!enLinea && (
                  <p className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600" role="status">
                    Sin conexión: iniciar sesión necesita internet. Cuando vuelva la red, inténtalo de nuevo.
                  </p>
                )}

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !enLinea || !password}
                  className="h-11 rounded-lg bg-orange-600 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Entrando…' : 'Entrar'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
