import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { MenuAdmin } from './components/MenuAdmin'

export default function MenuAdminPage() {
  const { usuario, loading, error } = useUsuario()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <AdminLayout usuario={usuario}>
      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">Administración</div>
        <h1 className="mt-1 text-[27px] font-extrabold">Menú y recetas</h1>
      </header>
      <MenuAdmin tenantId={usuario.tenant_id} />
    </AdminLayout>
  )
}
