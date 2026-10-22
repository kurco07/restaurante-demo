import { Outlet } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useKpisVentas } from '../../../controllers/gerencia/useKpisVentas'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { ESTILOS_ADMIN } from '../../components/ui/constants'
import { GerenciaSidebar } from './components/GerenciaSidebar'

// Panel de gerencia: barra lateral propia + la sección elegida. No pide
// sede: un gerente de cadena puede tener sede_id nulo y los KPIs suman
// todas las sedes de su restaurante (modelo-de-datos.md, usuarios).
// Requiere conexión: los reportes no son offline (arquitectura.md §1).
export default function GerenciaLayout() {
  const { usuario, loading, error } = useUsuario()
  const kpis = useKpisVentas()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <div
      className="grid min-h-screen grid-cols-[232px_1fr] bg-[var(--bg)] text-[var(--ink)]"
      style={ESTILOS_ADMIN}
    >
      <GerenciaSidebar nombre={usuario.nombre} rol={usuario.rol} alertas={kpis.alertas.length} />
      <main className="min-w-0 max-w-[1280px] px-[34px] pb-10 pt-7">
        <Outlet context={kpis} />
      </main>
    </div>
  )
}
