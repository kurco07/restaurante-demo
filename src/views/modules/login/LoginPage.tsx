import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../controllers/auth/useAuth'
import { supabase } from '../../../lib/supabaseClient'
import { inicioDe } from '../../../lib/rolesPorModulo'
import { mensajeDeError } from '../../../lib/errores'
import { useEnLinea } from '../../../controllers/useEnLinea'
import type { Rol } from '../../../models/types'
import { PanelMarcaAuth } from '../../components/ui/PanelMarcaAuth'
import { IconoCandado, IconoCorreo, IconoEscudo, IconoOjo, IconoOjoTachado, IconoRestaurante } from '../../components/ui/IconosAuth'

export default function LoginPage() {
  const { signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const enLinea = useEnLinea()

  async function iniciarSesion(correo: string, clave: string) {
    setSubmitting(true)
    setError(null)

    const { error } = await signIn(correo, clave)

    if (error) {
      setSubmitting(false)
      setError(error)
      return
    }

    // Se consulta el perfil acá mismo, directo, en vez de esperar al
    // UsuarioProvider del resto de la app — así no hay carrera entre "ya
    // hay sesión" y "ya sabemos el rol" justo antes de navegar.
    // Si falla (red, perfil borrado), se dice aquí en vez de mandar a "/",
    // que sin rol rebota de vuelta al login sin explicación (Fase 8,
    // Módulo 2).
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
        setError('Tu cuenta no tiene un perfil en ningún restaurante. Pídele al administrador que te dé acceso.')
        return
      }
      // Solo administración (y super_admin, que no tiene un enlace propio)
      // entra por aquí — el resto de los roles usa su enlace personal
      // (/acceso/<id>, migración 0046). Si alguien más llega hasta acá
      // (por ejemplo escribiendo su propio correo), se le cierra la
      // sesión antes de dejarlo pasar (decisión del dueño, 2026-11-14).
      if (perfil.rol !== 'administracion' && perfil.rol !== 'super_admin') {
        await signOut()
        setError('Este acceso es solo para administración. Pídele a tu administrador el enlace que te corresponde.')
        return
      }
      navigate(inicioDe(perfil.rol as Rol))
    } catch (e) {
      setError(mensajeDeError(e, 'Entraste, pero no se pudo cargar tu perfil. Intenta de nuevo.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    iniciarSesion(email, password)
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <PanelMarcaAuth
        titulo="Todo tu restaurante, en un solo lugar"
        descripcion="Mesoneros, cocina, inventario y gerencia, sincronizados en tiempo real — y siguen funcionando aunque se caiga el internet del local."
      />

      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 md:p-12 lg:p-16">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md">
            <IconoRestaurante className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold text-gray-900">Plataforma de Restaurantes</span>
        </div>

        <div className="flex w-full max-w-[400px] flex-col rounded-xl bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">Bienvenido de nuevo</h1>
            <p className="text-sm text-gray-500">Ingresa con tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span className="font-medium text-gray-900">Correo electrónico</span>
              <div className="relative flex items-center">
                <IconoCorreo className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-gray-400" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-lg bg-gray-50 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span className="font-medium text-gray-900">Contraseña</span>
              <div className="relative flex items-center">
                <IconoCandado className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-gray-400" />
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
              disabled={submitting || !enLinea}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 disabled:opacity-60"
            >
              {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            ¿Tu restaurante todavía no está en la plataforma?
            <Link to="/registro" className="ml-1 font-bold text-orange-600 hover:underline">
              Regístralo
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
            <IconoEscudo className="h-[15px] w-[15px] text-green-600" />
            Tus datos quedan aislados por restaurante — nunca se mezclan entre cuentas.
          </div>
        </div>
      </div>
    </div>
  )
}
