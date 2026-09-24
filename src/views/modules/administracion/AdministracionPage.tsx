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
    <div>
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-7 pt-7">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Administración</h1>
          <p className="text-sm text-gray-500">Menú y recetas</p>
        </div>
        <span className="text-2xl">🍔</span>
      </div>
      <MenuAdmin tenantId={usuario.tenant_id} />
    </div>
  )
}
