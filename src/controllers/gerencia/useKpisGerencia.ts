import { useOutletContext } from 'react-router-dom'
import type { useKpisVentas } from './useKpisVentas'

export type KpisGerencia = ReturnType<typeof useKpisVentas>

// Las páginas del panel de gerencia (Ventas, Rentabilidad, Inventario,
// Reporte por día, Sedes, Alertas) comparten un solo useKpisVentas, que
// vive en GerenciaLayout: el período y la sede elegidos se mantienen al
// cambiar de sección y no se vuelve a pedir todo.
export function useKpisGerencia() {
  return useOutletContext<KpisGerencia>()
}
