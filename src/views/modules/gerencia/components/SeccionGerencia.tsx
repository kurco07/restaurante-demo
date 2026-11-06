import type { ReactNode } from 'react'
import { PERIODOS_KPI } from '../../../../controllers/gerencia/useKpisVentas'
import { useKpisGerencia } from '../../../../controllers/gerencia/useKpisGerencia'
import { SelectorSede } from './SelectorSede'

interface SeccionGerenciaProps {
  titulo: string
  subtitulo: string
  // La página que compara sedes no filtra por una
  sinSelectorSede?: boolean
  children: ReactNode
}

// Encabezado común de las secciones del panel de gerencia: título, los
// selectores de sede y de período (compartidos entre secciones) y los
// estados de carga y error de los KPIs. El contenido se muestra cuando ya
// hay datos.
export function SeccionGerencia({ titulo, subtitulo, sinSelectorSede, children }: SeccionGerenciaProps) {
  const k = useKpisGerencia()

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--acento)]">Gerencia</div>
          <h1 className="mt-1 text-[27px] font-extrabold">{titulo}</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{subtitulo}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!sinSelectorSede && <SelectorSede />}
          <div className="flex flex-wrap gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
            {PERIODOS_KPI.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => k.setPeriodo(p.key)}
                className={`rounded-full px-[15px] py-[7px] text-[12.5px] font-semibold ${
                  k.periodo === p.key ? 'bg-[var(--orange)] text-white' : 'text-[var(--ink-soft)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {k.error && (
        <p className="mb-5 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--red)]">
          No se pudieron cargar los datos: {k.error}
        </p>
      )}

      {k.cargando && !k.datos && <p className="py-16 text-center text-sm text-[var(--ink-soft)]">Cargando…</p>}

      {k.datos && (
        <div className={k.cargando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>{children}</div>
      )}
    </>
  )
}
