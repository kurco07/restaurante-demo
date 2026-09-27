import { Navigate, useParams } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useLotesInsumo } from '../../../controllers/administracion/useLotesInsumo'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { TarjetasResumen } from './components/comunes'
import { EncabezadoLotes } from './components/lotes/EncabezadoLotes'
import { TablaLotes } from './components/lotes/TablaLotes'
import { RegistrarLotePanel } from './components/lotes/RegistrarLotePanel'

export default function LotesPage() {
  const { insumoId } = useParams()
  const { usuario, loading, error } = useUsuario()
  const { insumo, lotes, selector, resumen } = useLotesInsumo(insumoId)

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!insumo) return <Navigate to="/administracion/insumos" replace />

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoLotes insumo={insumo} selector={selector} />

      <TarjetasResumen
        items={[
          { valor: `${resumen.stockTotal} ${insumo.unidadCorta}`, etiqueta: 'Stock total (lotes activos)' },
          { valor: resumen.lotesActivos, etiqueta: 'Lotes activos' },
          { valor: resumen.porVencer, etiqueta: 'Lote por vencer', alerta: true },
        ]}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <TablaLotes lotes={lotes} unidad={insumo.unidadCorta} />
        <RegistrarLotePanel insumo={insumo} />
      </div>
    </AdminLayout>
  )
}
