import { insumos } from './mockData/insumos'
import { insumosConLotes, lotesPorInsumo } from './mockData/lotes'

// El insumo activo viene de la URL (/administracion/insumos/:insumoId/lotes),
// así el selector de arriba es navegación normal y no estado local.
export function useLotesInsumo(insumoId: string | undefined) {
  const insumo = insumos.find((i) => i.id === insumoId) ?? null
  const lotes = insumo ? (lotesPorInsumo[insumo.id] ?? []) : []
  const activos = lotes.filter((l) => l.estado !== 'agotado')

  return {
    insumo,
    lotes,
    selector: insumosConLotes
      .map((id) => insumos.find((i) => i.id === id))
      .filter((i) => i !== undefined),
    resumen: {
      stockTotal: activos.reduce((suma, l) => suma + l.cantidadRestante, 0),
      lotesActivos: activos.length,
      porVencer: lotes.filter((l) => l.estado === 'por_vencer').length,
    },
  }
}
