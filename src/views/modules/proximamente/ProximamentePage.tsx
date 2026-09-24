import { Link } from 'react-router-dom'

export default function ProximamentePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-4xl">🚧</span>
      <h1 className="text-2xl font-extrabold text-gray-900">Próximamente</h1>
      <p className="max-w-sm text-sm text-gray-500">
        Esta pantalla todavía no está construida — por ahora estamos armando el recorrido navegable de
        las interfaces.
      </p>
      <Link to="/inicio" className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white">
        Volver al inicio
      </Link>
    </div>
  )
}
