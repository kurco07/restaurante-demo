import { NavLink } from 'react-router-dom'

// Compartido entre las pantallas de inventario (Insumos, Movimientos,
// Conteo físico, Proveedores, Compras, Sugerencias IA) — cada una vive en
// su propia ruta bajo /administracion.
const tabs = [
  { label: 'Insumos', to: '/administracion/insumos' },
  { label: 'Movimientos', to: '/administracion/movimientos' },
  { label: 'Conteo físico', to: '/administracion/conteo-fisico' },
  { label: 'Proveedores', to: '/administracion/proveedores' },
  { label: 'Compras', to: '/administracion/compras' },
  { label: 'Sugerencias IA', to: '/administracion/sugerencias-compra' },
]

export function InventarioTabs() {
  return (
    <div className="mb-5 flex gap-1 border-b-2 border-[var(--border)]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `-mb-0.5 border-b-[3px] px-4 py-2.5 text-[13.5px] font-bold ${
              isActive ? 'border-[var(--orange)] text-[var(--orange-dark)]' : 'border-transparent text-[var(--ink-soft)]'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
