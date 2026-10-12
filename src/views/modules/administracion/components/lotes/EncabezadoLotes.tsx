import { Link, NavLink } from 'react-router-dom'
import type { Insumo } from '../../../../../models/types'

interface EncabezadoLotesProps {
  insumo: Insumo
  selector: Insumo[]
}

export function EncabezadoLotes({ insumo, selector }: EncabezadoLotesProps) {
  return (
    <>
      <Link to="/administracion/insumos" className="mb-4 inline-block text-[13px] font-semibold text-[var(--ink-soft)]">
        ← Volver a insumos
      </Link>

      <header className="mb-[18px] flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-[var(--orange)] text-[13px] font-extrabold text-white">
            {insumo.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Insumo</div>
            <div className="text-[21px] font-extrabold">{insumo.nombre}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-[var(--ink-soft)]">
          <span>{insumo.unidad_de_medida}</span>
          <Link to="/administracion/insumos" className="ml-2 whitespace-nowrap text-[12.5px] font-bold text-[var(--orange-dark)]">
            Editar insumo →
          </Link>
        </div>
      </header>

      {selector.length > 1 && (
        <nav className="mb-[18px] flex gap-2 overflow-x-auto">
          {selector.map((i) => (
            <NavLink
              key={i.id}
              to={`/administracion/insumos/${i.id}/lotes`}
              className={({ isActive }) =>
                `shrink-0 rounded-full border px-[15px] py-[9px] text-[12.5px] font-semibold ${
                  isActive
                    ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
                }`
              }
            >
              {i.nombre}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}
