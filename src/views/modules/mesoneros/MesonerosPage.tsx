import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { MapaMesas } from './components/MapaMesas'

export default function MesonerosPage() {
  const { usuario, loading, error } = useUsuario()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    <div className="mx-auto max-w-305 p-7">
      <MapaMesas usuario={usuario} />
    </div>
  )
}
