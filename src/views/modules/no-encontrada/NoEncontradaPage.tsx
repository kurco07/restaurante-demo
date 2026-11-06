import { Link } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { inicioDe } from '../../../lib/rolesPorModulo'

// Cualquier dirección que no existe (Fase 8, Módulo 2). Antes la página
// quedaba en blanco. El botón lleva al inicio del rol, o al login sin sesión.
export default function NoEncontradaPage() {
  const { usuario } = useUsuario()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] p-6 text-center">
      <p className="text-lg font-bold text-gray-900">Esta página no existe</p>
      <Link
        to={inicioDe(usuario?.rol)}
        replace
        className="rounded-lg bg-[var(--orange)] px-4 py-2 text-sm font-bold text-white"
      >
        Ir al inicio
      </Link>
    </div>
  )
}
