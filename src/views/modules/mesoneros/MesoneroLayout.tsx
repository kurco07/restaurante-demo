import { Outlet } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { CarritoProvider } from '../../../controllers/pedido/CarritoProvider'
import { useRecomendadosHoy } from '../../../controllers/mesonero/useRecomendadosHoy'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ESTILOS_CSS } from '../pedidos/components/constants'
import { BarraMesonero } from './components/BarraMesonero'

// Módulo del mesonero: barra superior (Mesas · Menú · Mis pedidos ·
// Sugeridos) + la
// sección elegida. Los borradores de pedido viven aquí (CarritoProvider)
// para que no se pierdan al cambiar de sección. Todo lee y escribe la
// SQLite local de PowerSync: sigue funcionando sin internet.
export default function MesoneroLayout() {
  const { usuario, loading, error } = useUsuario()
  // Recomendados del día (Fase 6, Módulo 4): se piden aquí una sola vez y
  // los comparten la barra (contador) y las secciones (menú y Sugeridos)
  const recomendados = useRecomendadosHoy(usuario?.sede_id ?? null)

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    // key: si en el mismo dispositivo entra otro mesonero, sus borradores
    // se cargan de cero en vez de heredar los del anterior
    <CarritoProvider key={usuario.id} usuarioId={usuario.id}>
      <div className="min-h-screen bg-[var(--bg)]" style={ESTILOS_CSS}>
        <BarraMesonero usuario={usuario} recomendados={recomendados?.items.length ?? 0} />
        <main className="px-4 py-6 sm:px-7">
          <Outlet context={recomendados} />
        </main>
      </div>
    </CarritoProvider>
  )
}
