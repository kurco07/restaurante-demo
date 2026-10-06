import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PanelMarcaAuth } from '../../components/ui/PanelMarcaAuth'
import {
  IconoCandado,
  IconoCorreo,
  IconoOjo,
  IconoOjoTachado,
  IconoPersona,
  IconoRestaurante,
  IconoTelefono,
} from '../../components/ui/IconosAuth'

// Alta de restaurante nuevo (Fase 7, Módulo 1 del roadmap) — todavía no
// construida de verdad. Esta pantalla es solo el recorrido navegable:
// valida en el cliente y manda a /proximamente, no crea tenant ni usuario.
export default function RegistroPage() {
  const navigate = useNavigate()
  const [nombreRestaurante, setNombreRestaurante] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!acepta) {
      setError('Tienes que aceptar los términos para continuar.')
      return
    }

    setEnviando(true)
    // Todavía no hay backend de self-service (ver Fase 7 del roadmap) —
    // esto es solo el recorrido navegable del prototipo.
    navigate('/proximamente')
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <PanelMarcaAuth
        titulo="Lleva tu restaurante a la plataforma"
        descripcion="En minutos tienes tu menú, tus mesas y tu equipo listos — sin depender de que el internet del local nunca falle."
      />

      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 md:p-12 lg:p-16">
        <div className="mb-6 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md">
            <IconoRestaurante className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold text-gray-900">Plataforma de Restaurantes</span>
        </div>

        <div className="flex w-full max-w-[420px] flex-col rounded-xl bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Registra tu restaurante</h1>
            <p className="mt-1 text-sm text-gray-500">Crea la cuenta de tu restaurante en la plataforma</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span className="font-medium text-gray-900">Nombre del restaurante</span>
              <div className="relative flex items-center">
                <IconoRestaurante className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-gray-400" />
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="Ej. Roof Burgers"
                  value={nombreRestaurante}
                  onChange={(e) => setNombreRestaurante(e.target.value)}
                  className="h-11 w-full rounded-lg bg-gray-50 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span className="font-medium text-gray-900">Tu nombre completo</span>
              <div className="relative flex items-center">
                <IconoPersona className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-gray-400" />
                <input
                  type="text"
                  required
                  minLength={3}
                  placeholder="Ej. Daniela Roa"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="h-11 w-full rounded-lg bg-gray-50 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <span className="text-xs text-gray-400">Quedas como gerencia — luego puedes crear cuentas de tu equipo.</span>
            </label>

            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span className="font-medium text-gray-900">Correo electrónico</span>
              <div className="relative flex items-center">
                <IconoCorreo className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg bg-gray-50 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span className="flex items-center justify-between font-medium text-gray-900">
                Teléfono
                <span className="text-xs font-normal text-gray-400">Opcional</span>
              </span>
              <div className="relative flex items-center">
                <IconoTelefono className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-gray-400" />
                <input
                  type="tel"
                  placeholder="0414-1234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
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
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
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

            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span className="font-medium text-gray-900">Confirmar contraseña</span>
              <div className="relative flex items-center">
                <IconoCandado className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-gray-400" />
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Repite tu contraseña"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="h-11 w-full rounded-lg bg-gray-50 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar((v) => !v)}
                  aria-label="Mostrar u ocultar la confirmación de contraseña"
                  className="absolute right-3 text-gray-400 hover:text-gray-700"
                >
                  {mostrarConfirmar ? <IconoOjoTachado /> : <IconoOjo />}
                </button>
              </div>
            </label>

            <label className="flex items-start gap-2.5 pt-1 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={acepta}
                onChange={(e) => setAcepta(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-orange-600"
              />
              <span>
                Acepto los <span className="font-semibold text-orange-600">términos y condiciones</span> y el manejo de
                mis datos.
              </span>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 disabled:opacity-60"
            >
              {enviando ? 'Creando cuenta…' : 'Registrar restaurante'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?
            <Link to="/login" className="ml-1 font-bold text-orange-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
