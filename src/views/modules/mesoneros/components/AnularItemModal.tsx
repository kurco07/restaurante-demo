import { useState } from 'react'
import { avisar } from '../../../../controllers/avisos/avisos'

export interface ItemAnulable {
  id: string
  nombre: string
  cantidad: number
  estado: string
}

interface AnularItemModalProps {
  item: ItemAnulable
  onConfirmar: (motivo: string) => Promise<void>
  onCerrar: () => void
}

const MOTIVOS_RAPIDOS = [
  'El cliente cambió de opinión',
  'Error al tomar el pedido',
  'Se acabó un ingrediente',
  'Demoró demasiado',
]

// Anular un plato ya enviado a cocina (solo supervisor). El motivo es
// obligatorio: queda registrado con quién y cuándo (migración 0015).
export function AnularItemModal({ item, onConfirmar, onCerrar }: AnularItemModalProps) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const yaPreparandose = item.estado === 'en_preparacion' || item.estado === 'listo'

  async function confirmar() {
    if (!motivo.trim()) return
    setEnviando(true)
    try {
      await onConfirmar(motivo)
    } catch (e) {
      avisar.error(e, 'No se pudo anular el plato')
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
          <p className="text-base font-extrabold text-[var(--ink)]">Anular plato</p>
          <button
            type="button"
            onClick={onCerrar}
            className="text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm font-semibold text-[var(--ink)]">
          {item.cantidad}× {item.nombre}
        </p>

        <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          {yaPreparandose
            ? 'Cocina ya lo estaba preparando: lo verá tachado y sus ingredientes se registran como merma.'
            : 'Cocina todavía no lo empezó: lo verá tachado y no se descuenta nada del inventario.'}{' '}
          No se cobrará en la cuenta.
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
            {enviando ? 'Anulando…' : 'Anular plato'}
          </button>
        </div>
      </div>
    </div>
  )
}
