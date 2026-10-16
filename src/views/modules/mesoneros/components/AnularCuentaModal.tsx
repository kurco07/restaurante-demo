import { useState } from 'react'
import type { ItemAnulable } from './AnularItemModal'

interface AnularCuentaModalProps {
  items: ItemAnulable[]
  onConfirmar: (motivo: string) => Promise<void>
  onCerrar: () => void
}

const MOTIVOS_RAPIDOS = ['El cliente se fue', 'Error al tomar el pedido completo', 'La mesa se canceló']

// Anula de una vez todos los platos activos de la mesa (solo supervisor) —
// mismo motivo para todos, en vez de uno por uno. Si no queda nada activo
// ni entregado, la mesa vuelve sola a libre (migración 0016).
export function AnularCuentaModal({ items, onConfirmar, onCerrar }: AnularCuentaModalProps) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const hayPreparandose = items.some((i) => i.estado === 'en_preparacion' || i.estado === 'listo')

  async function confirmar() {
    if (!motivo.trim()) return
    setEnviando(true)
    try {
      await onConfirmar(motivo)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2b2118]/35 p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-extrabold text-[var(--ink)]">Anular cuenta completa</p>
          <button
            type="button"
            onClick={onCerrar}
            className="text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 max-h-32 overflow-y-auto rounded-xl border border-[var(--border)] px-3 py-2">
          {items.map((item) => (
            <p key={item.id} className="py-0.5 text-sm font-semibold text-[var(--ink)]">
              {item.cantidad}× {item.nombre}
            </p>
          ))}
        </div>

        <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          Se anulan los {items.length} platos de arriba de una vez.{' '}
          {hayPreparandose
            ? 'Los que ya se estaban preparando registran merma de sus ingredientes.'
            : 'Ninguno se había empezado a preparar.'}{' '}
          No se cobra nada en la cuenta — si no queda ningún plato entregado, la mesa vuelve sola a libre.
        </p>

        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[var(--ink-soft)]">Motivo</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {MOTIVOS_RAPIDOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotivo(m)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                motivo === m
                  ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                  : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--ink-soft)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          placeholder="O escribe el motivo…"
          className="mb-4 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        />

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--ink-soft)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={!motivo.trim() || enviando}
            className="flex-1 rounded-xl bg-[var(--red)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {enviando ? 'Anulando…' : `Anular ${items.length} platos`}
          </button>
        </div>
      </div>
    </div>
  )
}
