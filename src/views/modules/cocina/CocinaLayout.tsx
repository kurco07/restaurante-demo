import { Outlet } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ESTILOS_CSS } from '../pedidos/components/constants'
import { BarraCocina } from './components/BarraCocina'

// Módulo de cocina: barra superior (Pedidos · Entregados · Recetas) + la
// sección elegida. Todo lee y escribe la SQLite local de PowerSync: sigue
// funcionando sin internet.
export default function CocinaLayout() {
  const { usuario, loading, error } = useUsuario()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    <div className="min-h-screen bg-[var(--bg)]" style={ESTILOS_CSS}>
      <BarraCocina usuario={usuario} />
      <main className="px-4 py-6 sm:px-7">
        <Outlet />
      </main>
    </div>
  )
}
