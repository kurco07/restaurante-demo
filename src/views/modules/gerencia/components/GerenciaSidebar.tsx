import type { Rol } from '../../../../models/types'
import { PanelSidebar, type EnlaceSidebar } from '../../../components/layout/PanelSidebar'

interface GerenciaSidebarProps {
  nombre: string
  rol: Rol
  // Alertas activas, para el contador junto a "Alertas"
  alertas: number
}

const enlaces: EnlaceSidebar[] = [
  {
    label: 'Ventas',
    to: '/gerencia',
    icono: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  },
  {
    label: 'Rentabilidad',
    to: '/gerencia/rentabilidad',
    icono: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11" />
      </>
    ),
  },
  {
    label: 'Inventario',
    to: '/gerencia/inventario',
    icono: (
      <>
        <path d="M3 8l9-5 9 5-9 5-9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
  },
  {
    label: 'Reporte por día',
    to: '/gerencia/reportes',
    icono: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    label: 'Sedes',
    to: '/gerencia/sedes',
    icono: (
      <>
        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>
    ),
  },
  {
    label: 'Alertas',
    to: '/gerencia/alertas',
    icono: (
      <>
        <path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2z" />
        <path d="M10 20a2 2 0 004 0" />
      </>
    ),
  },
]

export function GerenciaSidebar({ nombre, rol, alertas }: GerenciaSidebarProps) {
  const conContador = enlaces.map((e) => (e.to === '/gerencia/alertas' ? { ...e, contador: alertas } : e))
  return <PanelSidebar enlaces={conContador} nombre={nombre} rol={rol} />
}
