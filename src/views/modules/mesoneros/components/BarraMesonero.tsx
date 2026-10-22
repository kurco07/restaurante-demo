import { useCarritos } from '../../../../controllers/pedido/useCarritos'
import { useMisPedidos } from '../../../../controllers/mesonero/useMisPedidos'
import type { Rol, Usuario } from '../../../../models/types'
import { puedeSupervisar } from '../../../../lib/permisos'
import { BarraSuperior, type PestanaBarra } from '../../../components/layout/BarraSuperior'
import { MenuUsuario } from '../../../components/layout/MenuUsuario'

const ETIQUETA_ROL: Partial<Record<Rol, string>> = {
  mesonero: 'Mesonero',
  supervisor: 'Supervisor',
  gerencia: 'Gerencia',
}

// Barra superior del mesonero: Mesas · Menú · Mis pedidos (+ Reporte del
// día para el supervisor), y a la derecha su nombre con "Cerrar sesión".
export function BarraMesonero({ usuario }: { usuario: Usuario }) {
  const { totalPlatos } = useCarritos()
  const { listos } = useMisPedidos(usuario)

  const pestanas: PestanaBarra[] = [
    {
      label: 'Mesas',
      to: '/mesoneros',
      end: true,
      icono: (
        <>
          <rect x="3" y="9" width="18" height="4" rx="1.5" />
          <path d="M5 13v7M19 13v7" />
        </>
      ),
    },
    {
      label: 'Menú',
      to: '/mesoneros/menu',
      contador: totalPlatos,
      icono: <path d="M3 10h18M3 14h18M4 10a8 6 0 0116 0M4 14a1 1 0 001 1h14a1 1 0 001-1" />,
    },
    {
      label: 'Mis pedidos',
      to: '/mesoneros/pedidos',
      contador: listos,
      urgente: true,
      icono: (
        <>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
          <path d="M9 8h6M9 12h6" />
        </>
      ),
    },
  ]

  if (puedeSupervisar(usuario.rol)) {
    pestanas.push({
      label: 'Reporte del día',
      to: '/mesoneros/reporte',
      icono: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    })
  }

  return (
    <BarraSuperior
      pestanas={pestanas}
      derecha={<MenuUsuario nombre={usuario.nombre} rol={ETIQUETA_ROL[usuario.rol] ?? usuario.rol} />}
    />
  )
}
