import { Outlet } from 'react-router-dom'
import { RedDeModulo } from '../../components/ErrorBoundary'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { CarritoProvider } from '../../../controllers/pedido/CarritoProvider'
import { useRecomendadosHoy } from '../../../controllers/mesonero/useRecomendadosHoy'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { MarcaAguaFondo } from '../../components/ui/MarcaAguaFondo'
import { ESTILOS_CSS } from '../pedidos/components/constants'
import { BarraMesonero } from './components/BarraMesonero'

// Módulo del mesonero: barra superior (Mesas · Menú · Mis pedidos ·
// Sugeridos) + la
// sección elegida. Los borradores de pedido viven aquí (CarritoProvider)
// para que no se pierdan al cambiar de sección. Todo lee y escribe la
// SQLite local de PowerSync: sigue funcionando sin internet.
export default function MesoneroLayout() {
  const { usuario, loading, error, modulosActivos } = useUsuario()
  // Recomendados del día (Fase 6, Módulo 4): se piden aquí una sola vez y
  // los comparten la barra (contador) y las secciones (menú y Sugeridos).
  // Si el restaurante tiene el módulo apagado (Fase 7, Módulo 5), se
  // esconde en todos lados aunque haya recomendados ya aprobados de antes.
  const recomendadosActivo = !modulosActivos || modulosActivos.has('ia_recomendados')
  const recomendadosCrudo = useRecomendadosHoy(usuario?.sede_id ?? null)
  const recomendados = recomendadosActivo ? recomendadosCrudo : null

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    // key: si en el mismo dispositivo entra otro mesonero, sus borradores
    // se cargan de cero en vez de heredar los del anterior
    <CarritoProvider key={usuario.id} usuarioId={usuario.id}>
      <div className="min-h-screen bg-[var(--bg)]" style={ESTILOS_CSS}>
        <MarcaAguaFondo />
        <BarraMesonero usuario={usuario} recomendados={recomendados?.items.length ?? 0} />
        <main className="px-4 py-6 sm:px-7">
          <RedDeModulo nombre="mesonero">
          <Outlet context={recomendados} />
        </RedDeModulo>
        </main>
      </div>
    </CarritoProvider>
  )
}
