import { TableroCocina } from './components/TableroCocina'
import { PlatosSugeridosHoy } from './components/PlatosSugeridosHoy'

// Sección "Pedidos" de cocina: los platos sugeridos para hoy (si gerencia
// aprobó una lista) y el tablero. El usuario y la sede ya los valida
// CocinaLayout.
export default function CocinaPage() {
  return (
    <>
      <PlatosSugeridosHoy />
      <TableroCocina />
    </>
  )
}
