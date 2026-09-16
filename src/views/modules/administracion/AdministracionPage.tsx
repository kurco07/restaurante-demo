import { useUsuario } from '../../../controllers/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { MenuAdmin } from './components/MenuAdmin'

export default function AdministracionPage() {
  const { usuario, loading, error } = useUsuario()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <div className="flex min-h-screen flex-col">
      <h1 className="mx-auto mt-6 text-3xl font-semibold">Administración — Menú y recetas</h1>
      <MenuAdmin tenantId={usuario.tenant_id} />
    </div>
  )
}
