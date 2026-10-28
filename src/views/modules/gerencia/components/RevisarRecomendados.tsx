import { useState } from 'react'
import type { RecomendadoAprobado, SugerenciaRecomendados } from '../../../../models/types'
import { formatearMoneda } from '../../../components/ui/constants'

const MAX_FRASE = 140

interface Fila {
  incluido: boolean
  frase: string
}

interface RevisarRecomendadosProps {
  sugerencia: SugerenciaRecomendados
  nombreSede?: string
  guardando: boolean
  onAprobar: (items: RecomendadoAprobado[]) => void
  onRechazar: (motivo: string) => void
}

// Revisión de los recomendados del día (Fase 6, Módulos 4 y 5). La frase
// es lo que leen mesonero y cliente: gerencia la puede reescribir. El
// motivo y los números son solo para gerencia. Se publican de 1 a 5.
export function RevisarRecomendados({ sugerencia, nombreSede, guardando, onAprobar, onRechazar }: RevisarRecomendadosProps) {
  const [filas, setFilas] = useState<Record<string, Fila>>(() =>
    Object.fromEntries(sugerencia.items.map((i) => [i.menu_item_id, { incluido: true, frase: i.frase }])),
  )
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')

  function cambiar(id: string, cambios: Partial<Fila>) {
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], ...cambios } }))
  }

  const marcados = sugerencia.items.filter((i) => filas[i.menu_item_id].incluido)
  const sinFrase = marcados.filter((i) => !filas[i.menu_item_id].frase.trim())
  const fueraDeRango = marcados.length < 1 || marcados.length > 5

  return (
    <section className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-[18px]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[17px] font-extrabold">Recomendados de hoy{nombreSede && ` · ${nombreSede}`}</p>
          <p className="text-xs text-[var(--ink-soft)]">
            Generada el {new Date(sugerencia.generada_en).toLocaleString('es')}
            {sugerencia.modelo && ` · ${sugerencia.modelo}`}
          </p>
        </div>
        <span className="rounded-full bg-[var(--orange-bg)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--orange-dark)]">
          Pendiente de revisar
        </span>
      </div>

      {sugerencia.resumen && <p className="mb-4 rounded-xl bg-[var(--surface-alt)] px-4 py-3 text-[13px]">{sugerencia.resumen}</p>}

      <ul className="flex flex-col gap-3">
        {sugerencia.items.map((i) => {
          const f = filas[i.menu_item_id]
          return (
            <li
              key={i.menu_item_id}
              className={`rounded-xl border border-[var(--border)] px-4 py-3 ${f.incluido ? '' : 'opacity-50'}`}
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.incluido}
                  onChange={(e) => cambiar(i.menu_item_id, { incluido: e.target.checked })}
                />
                <span className="text-[14px] font-extrabold">⭐ {i.plato}</span>
              </label>
              <label className="mt-2 block text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--ink-soft)]">
                Frase para el mesonero y el cliente
                <input
                  value={f.frase}
                  maxLength={MAX_FRASE}
                  disabled={!f.incluido}
                  onChange={(e) => cambiar(i.menu_item_id, { frase: e.target.value })}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-[13px] font-normal normal-case tracking-normal text-[var(--ink)] ${
                    f.incluido && !f.frase.trim() ? 'border-[var(--red)]' : 'border-[var(--border)]'
                  }`}
                />
              </label>
              <p className="mt-2 text-[12px] text-[var(--ink-soft)]">
                <b>Por qué (solo gerencia):</b> {i.motivo || '—'}
                {i.margen != null && ` · margen ${formatearMoneda(Number(i.margen))}`}
                {i.margen_pct != null && ` (${Number(i.margen_pct).toLocaleString('es')}%)`}
                {i.porciones_posibles != null && ` · alcanza para ${i.porciones_posibles}`}
                {i.por_vencer.length > 0 &&
                  ` · vence: ${i.por_vencer.map((v) => `${v.insumo.replace(/^Demo · /, '')} (${v.dias === 0 ? 'hoy' : `${v.dias} d`})`).join(', ')}`}
              </p>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <p className="text-[13px]">
          <b>{marcados.length}</b> de {sugerencia.items.length} platos
          {fueraDeRango && <span className="block text-xs font-semibold text-[var(--red)]">Deja entre 1 y 5 platos.</span>}
          {sinFrase.length > 0 && (
            <span className="block text-xs font-semibold text-[var(--red)]">Falta la frase en: {sinFrase.map((i) => i.plato).join(', ')}</span>
          )}
        </p>
        {!rechazando ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRechazando(true)}
              disabled={guardando}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-[13px] font-semibold text-[var(--ink-soft)] disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => onAprobar(marcados.map((i) => ({ menu_item_id: i.menu_item_id, frase: filas[i.menu_item_id].frase.trim() })))}
              disabled={guardando || fueraDeRango || sinFrase.length > 0}
              className="rounded-full bg-[var(--orange)] px-5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : `Publicar en el menú${nombreSede ? ` · ${nombreSede}` : ''}`}
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <input
              autoFocus
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="¿Por qué los rechazas?"
              className="min-w-[220px] flex-1 rounded-full border border-[var(--border)] px-4 py-2 text-[13px]"
            />
            <button type="button" onClick={() => setRechazando(false)} className="rounded-full px-3 py-2 text-[13px] font-semibold text-[var(--ink-soft)]">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onRechazar(motivo)}
              disabled={guardando || !motivo.trim()}
              className="rounded-full bg-[var(--red)] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
            >
              Confirmar rechazo
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
