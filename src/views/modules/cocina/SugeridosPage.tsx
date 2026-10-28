import { useOutletContext } from 'react-router-dom'
import type { PlatosSugeridosHoy } from '../../../models/types'
import { useEstadoConexion } from '../../../controllers/useEstadoConexion'

// Sección "Sugeridos" de cocina (Fase 6, Módulo 3): los platos que gerencia
// aprobó para preparar hoy, con porciones y motivo, sin precios. La lista
// la pide CocinaLayout (es lo único de cocina que necesita red): sin
// internet se ve la última que llegó.
export default function SugeridosPage() {
  const lista = useOutletContext<PlatosSugeridosHoy | null>()
  const { conectado } = useEstadoConexion()

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="mb-5">
        <h1 className="text-[22px] font-extrabold text-[var(--ink)]">Platos sugeridos para hoy</h1>
        <p className="text-xs text-[var(--ink-soft)]">
          Lo que conviene tener preparado según el stock, las ventas de este día y los insumos por vencer. Lo aprueba
          gerencia.
          {lista?.aprobada_en &&
            ` Aprobada a las ${new Date(lista.aprobada_en).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}.`}
        </p>
      </header>

      {!lista || lista.items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center">
          <p className="text-[15px] font-extrabold text-[var(--ink)]">Todavía no hay platos sugeridos para hoy</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            {conectado
              ? 'Aparecen aquí cuando gerencia apruebe la lista del día.'
              : 'Sin conexión: la lista aparece cuando vuelva internet. Los pedidos siguen funcionando normal.'}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.items.map((p, i) => (
            <li key={p.plato} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-extrabold text-[var(--ink)]">
                  <span className="mr-1.5 text-[var(--ink-soft)]">{i + 1}.</span>
                  {p.plato}
                </span>
                <span className="shrink-0 rounded-full bg-[var(--surface-alt)] px-2.5 py-0.5 text-[13px] font-bold text-[var(--orange-dark)]">
                  {p.porciones} porc.
                </span>
              </div>
              {p.motivo && <p className="mt-1 text-[12.5px] text-[var(--ink-soft)]">{p.motivo}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
