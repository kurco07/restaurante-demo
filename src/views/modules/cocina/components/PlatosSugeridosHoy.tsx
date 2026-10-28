import { useState } from 'react'
import { usePlatosSugeridosHoy } from '../../../../controllers/cocina/usePlatosSugeridosHoy'

// "Platos sugeridos para hoy" en el tablero de cocina (Fase 6, Módulo 3):
// la lista que aprobó gerencia, con porciones y motivo, sin precios. Si
// no hay lista aprobada hoy (o nunca llegó por falta de internet), no
// ocupa lugar. Se puede plegar para que no tape los pedidos.
export function PlatosSugeridosHoy() {
  const lista = usePlatosSugeridosHoy()
  const [abierto, setAbierto] = useState(true)

  if (!lista || lista.items.length === 0) return null

  return (
    <section className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-center justify-between text-left">
        <span className="text-[14px] font-extrabold text-[var(--ink)]">
          ✦ Platos sugeridos para hoy <span className="font-semibold text-[var(--ink-soft)]">· {lista.items.length}</span>
        </span>
        <span className="text-xs font-semibold text-[var(--orange-dark)]">{abierto ? 'Ocultar' : 'Ver'}</span>
      </button>

      {abierto && (
        <ul className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {lista.items.map((p) => (
            <li key={p.plato} className="rounded-xl bg-white px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13.5px] font-bold">{p.plato}</span>
                <span className="shrink-0 rounded-full bg-orange-100 px-2 py-px text-[12px] font-bold text-[var(--orange-dark)]">
                  {p.porciones} porc.
                </span>
              </div>
              {p.motivo && <p className="mt-0.5 text-[12px] text-[var(--ink-soft)]">{p.motivo}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
