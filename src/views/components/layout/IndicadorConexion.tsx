import { useEstadoConexion } from '../../../controllers/useEstadoConexion'

// "En línea" / "Sin conexión" según PowerSync. Sin conexión todo sigue
// funcionando contra la base local y los cambios suben al volver.
export function IndicadorConexion() {
  const { conectado, subiendo } = useEstadoConexion()

  const texto = !conectado ? 'Sin conexión' : subiendo ? 'Sincronizando…' : 'En línea'
  const titulo = conectado
    ? 'Conectado: los cambios se sincronizan al instante'
    : 'Sin conexión: puedes seguir trabajando, los cambios se guardan y suben al volver'

  return (
    <span
      title={titulo}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        conectado ? 'bg-green-50 text-green-700' : 'bg-red-50 text-[var(--red)]'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${conectado ? 'bg-green-500' : 'animate-pulse bg-[var(--red)]'}`} />
      <span className="hidden sm:inline">{texto}</span>
    </span>
  )
}
