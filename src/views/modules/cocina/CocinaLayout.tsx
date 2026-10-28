import { Outlet } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { usePlatosSugeridosHoy } from '../../../controllers/cocina/usePlatosSugeridosHoy'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ESTILOS_CSS } from '../pedidos/components/constants'
import { BarraCocina } from './components/BarraCocina'

// Módulo de cocina: barra superior (Pedidos · Sugeridos · Entregados ·
// Recetas) + la sección elegida. Todo lee y escribe la SQLite local de
// PowerSync y sigue funcionando sin internet, salvo los platos sugeridos
// (Fase 6, Módulo 3), que se piden aquí una sola vez y los comparten la
// barra (contador) y la página.
export default function CocinaLayout() {
  const { usuario, loading, error } = useUsuario()
  const sugeridos = usePlatosSugeridosHoy()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    <div className="min-h-screen bg-[var(--bg)]" style={ESTILOS_CSS}>
      <BarraCocina usuario={usuario} sugeridos={sugeridos?.items.length ?? 0} />
      <main className="px-4 py-6 sm:px-7">
        <Outlet context={sugeridos} />
      </main>
    </div>
  )
}
