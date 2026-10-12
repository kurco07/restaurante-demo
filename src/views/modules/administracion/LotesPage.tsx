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
  const { usuario, loading: loadingUsuario, error: errorUsuario } = useUsuario()
  const l = useLotesInsumo(insumoId)

  if (loadingUsuario || l.loading) return <LoadingSpinner message="Cargando…" />
  if (errorUsuario) return <ErrorMessage message={errorUsuario} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />
  if (!l.insumo) return <Navigate to="/administracion/insumos" replace />
  if (l.insumo.tipo !== 'por_lote') return <Navigate to="/administracion/insumos" replace />

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoLotes insumo={l.insumo} selector={l.selector} />

      {l.error && <ErrorMessage message={l.error} />}

      <TarjetasResumen
        items={[
          { valor: `${l.resumen.stockTotal} ${l.insumo.unidad_de_medida}`, etiqueta: 'Stock total (lotes activos)' },
          { valor: l.resumen.lotesActivos, etiqueta: 'Lotes activos' },
          { valor: l.resumen.porVencer, etiqueta: 'Lotes por vencer', alerta: true },
        ]}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <TablaLotes lotes={l.lotes} primerActivoId={l.primerActivoId} unidad={l.insumo.unidad_de_medida} />
        <RegistrarLotePanel insumo={l.insumo} guardando={l.guardando} onRegistrar={l.crear} />
      </div>
    </AdminLayout>
  )
}
