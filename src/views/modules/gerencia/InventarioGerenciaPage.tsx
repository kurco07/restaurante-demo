import { useKpisGerencia } from '../../../controllers/gerencia/useKpisGerencia'
import { PanelCard } from '../../components/ui/PanelCard'
import { SeccionGerencia } from './components/SeccionGerencia'
import { TablaRotacion } from './components/TablaRotacion'

// Rotación de inventario del período (Fase 5, Módulo 1). Solo lectura:
// el stock, las compras y los conteos los maneja administración.
export default function InventarioGerenciaPage() {
  const k = useKpisGerencia()

  return (
    <SeccionGerencia titulo="Inventario" subtitulo="Rotación de insumos en el período">
      <PanelCard
        titulo="Rotación de inventario"
        subtitulo="Cuánto se gastó de cada insumo en el período, para cuántos días alcanza lo que queda y cuánto dinero hay en stock"
      >
        <TablaRotacion filas={k.inventario} />
      </PanelCard>
    </SeccionGerencia>
  )
}
