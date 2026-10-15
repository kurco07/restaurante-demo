import { useState } from 'react'
import { useKpisGerencia } from '../../../controllers/gerencia/useKpisGerencia'
import type { RentabilidadPlato } from '../../../models/types'
import { formatearMoneda } from '../../components/ui/constants'
import { PanelCard } from '../../components/ui/PanelCard'
import { FichaRecetaModal } from './components/FichaRecetaModal'
import { SeccionGerencia } from './components/SeccionGerencia'
import { TablaRentabilidad } from './components/TablaRentabilidad'

// Rentabilidad por plato del período (Fase 5, Módulo 1), con la ficha de
// la receta de cada plato en solo lectura.
export default function RentabilidadPage() {
  const k = useKpisGerencia()
  const [platoAbierto, setPlatoAbierto] = useState<RentabilidadPlato | null>(null)
  const r = k.resumenRentabilidad

  return (
    <SeccionGerencia titulo="Rentabilidad" subtitulo="Ganancia por plato vendido en el período">
      <PanelCard
        titulo="Rentabilidad por plato"
        subtitulo="Precio cobrado contra el costo de su receta, con la última compra recibida de cada insumo"
      >
        <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-xl bg-[var(--surface-alt)] px-4 py-3">
          <div>
            <span className="text-[19px] font-extrabold">{formatearMoneda(r.ganancia)}</span>
            <span className="ml-1.5 text-xs text-[var(--ink-soft)]">ganancia bruta</span>
          </div>
          <div>
            <span className="text-[19px] font-extrabold">{r.margenPct != null ? `${r.margenPct.toFixed(1)}%` : '—'}</span>
            <span className="ml-1.5 text-xs text-[var(--ink-soft)]">margen</span>
          </div>
          <p className="text-[11.5px] text-[var(--ink-soft)]">
            Sobre {r.platosConCosto} plato
            {r.platosConCosto === 1 ? '' : 's'} con costo completo
            {r.platosSinCosto > 0 && ` · ${r.platosSinCosto} sin receta o con insumos sin compra registrada no entran`}
          </p>
        </div>
        <TablaRentabilidad filas={k.rentabilidad} insumosSinCompra={k.insumosSinCompra} onVerReceta={setPlatoAbierto} />
      </PanelCard>

      {platoAbierto && (
        <FichaRecetaModal key={platoAbierto.menu_item_id} plato={platoAbierto} onCerrar={() => setPlatoAbierto(null)} />
      )}
    </SeccionGerencia>
  )
}
