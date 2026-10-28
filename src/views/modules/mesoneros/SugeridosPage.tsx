import { useNavigate, useOutletContext } from 'react-router-dom'
import type { RecomendadosHoy } from '../../../models/types'
import { useEstadoConexion } from '../../../controllers/useEstadoConexion'

// Sección "Sugeridos" del mesonero (Fase 6, Módulo 4): los platos que
// gerencia recomienda ofrecer hoy, con la frase para ofrecerlos. Sin
// precios ni costos. "Agregar" abre el plato en el menú para anotarlo.
// La lista la pide MesoneroLayout y queda guardada para usarla sin red.
export default function SugeridosPage() {
  const lista = useOutletContext<RecomendadosHoy | null>()
  const { conectado } = useEstadoConexion()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-[900px]">
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold text-[var(--ink)]">⭐ Recomendados de hoy</h1>
        <p className="text-xs text-[var(--ink-soft)]">
          Los platos que conviene ofrecer hoy. También aparecen arriba en el menú y en el QR de las mesas.
        </p>
      </header>

      {!lista || lista.items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center">
          <p className="text-[15px] font-extrabold text-[var(--ink)]">Todavía no hay recomendados para hoy</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            {conectado
              ? 'Aparecen aquí cuando gerencia los publique.'
              : 'Sin conexión: aparecen cuando vuelva internet. Puedes seguir tomando pedidos normal.'}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.items.map((r) => (
            <li
              key={r.menu_item_id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5"
            >
              <div>
                <p className="text-[15px] font-extrabold text-[var(--ink)]">⭐ {r.plato}</p>
                <p className="mt-0.5 text-[13px] text-[var(--ink-soft)]">{r.frase}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/mesoneros/menu', { state: { abrirPlato: r.menu_item_id } })}
                className="shrink-0 rounded-full bg-[var(--orange)] px-4 py-2 text-xs font-extrabold text-white"
              >
                Agregar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
