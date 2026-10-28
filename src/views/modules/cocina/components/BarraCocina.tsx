import { useAhora } from '../../../../controllers/useAhora'
import { useCocina } from '../../../../controllers/cocina/useCocina'
import type { Rol, Usuario } from '../../../../models/types'
import { BarraSuperior, type PestanaBarra } from '../../../components/layout/BarraSuperior'
import { IndicadorConexion } from '../../../components/layout/IndicadorConexion'
import { MenuUsuario } from '../../../components/layout/MenuUsuario'

const ETIQUETA_ROL: Partial<Record<Rol, string>> = {
  cocina: 'Cocina',
  supervisor: 'Supervisor',
  gerencia: 'Gerencia',
}

function Reloj() {
  const ahora = useAhora(15_000)
  return (
    <span className="text-lg font-extrabold tabular-nums text-[var(--ink)]">
      {new Date(ahora).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

// Barra superior de cocina: Pedidos (el tablero) · Sugeridos · Entregados ·
// Recetas, y a la derecha el estado de conexión, la hora y el usuario.
// Ligera a propósito: el tablero es la pantalla principal (§4.2).
// sugeridos = cuántos platos tiene la lista aprobada hoy por gerencia.
export function BarraCocina({ usuario, sugeridos }: { usuario: Usuario; sugeridos: number }) {
  const { contador } = useCocina()

  const pestanas: PestanaBarra[] = [
    {
      label: 'Pedidos',
      to: '/cocina',
      end: true,
      // Tickets que esperan que alguien empiece a prepararlos
      contador: contador('pendiente'),
      icono: (
        <>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
          <path d="M9 8h6M9 12h6" />
        </>
      ),
    },
    {
      label: 'Sugeridos',
      to: '/cocina/sugeridos',
      contador: sugeridos,
      icono: <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />,
    },
    {
      label: 'Entregados',
      to: '/cocina/entregados',
      icono: <path d="M4 12l5 5L20 6" />,
    },
    {
      label: 'Recetas',
      to: '/cocina/recetas',
      icono: (
        <>
          <path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4z" />
          <path d="M9 9h6M9 13h6" />
        </>
      ),
    },
  ]

  return (
    <BarraSuperior
      pestanas={pestanas}
      derecha={
        <>
          <IndicadorConexion />
          <Reloj />
          <MenuUsuario nombre={usuario.nombre} rol={ETIQUETA_ROL[usuario.rol] ?? usuario.rol} />
        </>
      }
    />
  )
}
