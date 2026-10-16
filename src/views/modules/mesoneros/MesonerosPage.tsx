import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { MapaMesas } from './components/MapaMesas'

// Sección "Mesas" del mesonero. El usuario y la sede ya los valida
// MesoneroLayout.
export default function MesonerosPage() {
  const { usuario } = useUsuario()
  if (!usuario) return null

  return (
    <div className="mx-auto max-w-305">
      <MapaMesas usuario={usuario} />
    </div>
  )
}
