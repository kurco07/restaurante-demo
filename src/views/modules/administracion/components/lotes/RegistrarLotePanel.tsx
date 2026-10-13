import { useState, type FormEvent } from 'react'
import type { Insumo } from '../../../../../models/types'

interface RegistrarLotePanelProps {
  insumo: Insumo
  guardando: boolean
  onRegistrar: (datos: { cantidad_inicial: number; fecha_vencimiento: string | null }) => Promise<void>
}

export function RegistrarLotePanel({ insumo, guardando, onRegistrar }: RegistrarLotePanelProps) {
  const [cantidad, setCantidad] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await onRegistrar({
        cantidad_inicial: Number(cantidad),
        fecha_vencimiento: fechaVencimiento || null,
      })
      setCantidad('')
      setFechaVencimiento('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el lote.')
    }
  }

  return (
    <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="mb-1 text-base font-extrabold">Registrar nuevo lote</p>
      <p className="mb-4 text-xs text-[var(--ink-soft)]">Entrada de inventario · {insumo.nombre}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-[13px]">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            Cantidad recibida ({insumo.unidad_de_medida})
          </span>
          <input
            required
            type="number"
            min="0.001"
            step="0.001"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            Fecha de vencimiento (opcional)
          </span>
          <input
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
        </label>

        <div className="my-1 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-3 py-[11px] text-xs leading-[1.4] text-[var(--ink-soft)]">
          Al registrar el lote, el stock de este insumo se actualiza automáticamente y queda en cola según su fecha
          de vencimiento (FEFO).
        </div>

        {error && <p className="text-[var(--red)]">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="mt-1 w-full rounded-xl bg-[var(--orange)] p-3.5 text-center text-sm font-bold text-white disabled:opacity-50"
        >
          {guardando ? 'Registrando…' : 'Registrar entrada de lote'}
        </button>
      </form>
    </div>
  )
}
