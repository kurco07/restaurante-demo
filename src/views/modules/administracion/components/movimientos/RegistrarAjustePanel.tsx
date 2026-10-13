import { useState } from 'react'
import type { Insumo } from '../../../../../models/types'

interface RegistrarAjustePanelProps {
  insumos: Insumo[]
  insumoId: string
  setInsumoId: (id: string) => void
  tipoAjuste: 'merma' | 'ajuste'
  setTipoAjuste: (tipo: 'merma' | 'ajuste') => void
  tiposAjuste: { key: 'merma' | 'ajuste'; label: string }[]
  cantidad: string
  setCantidad: (valor: string) => void
  motivo: string
  setMotivo: (valor: string) => void
  motivosAjuste: string[]
  nota: string
  setNota: (valor: string) => void
  stockDisponible: number
  excedeStock: boolean
  guardando: boolean
  onRegistrar: () => Promise<void>
}

export function RegistrarAjustePanel({
  insumos,
  insumoId,
  setInsumoId,
  tipoAjuste,
  setTipoAjuste,
  tiposAjuste,
  cantidad,
  setCantidad,
  motivo,
  setMotivo,
  motivosAjuste,
  nota,
  setNota,
  stockDisponible,
  excedeStock,
  guardando,
  onRegistrar,
}: RegistrarAjustePanelProps) {
  const [error, setError] = useState<string | null>(null)

  async function handleRegistrar() {
    setError(null)
    try {
      await onRegistrar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el ajuste.')
    }
  }

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <select
        value={insumoId}
        onChange={(e) => setInsumoId(e.target.value)}
        className="rounded-lg border border-[var(--border)] px-3 py-2"
      >
        <option value="">Seleccionar insumo…</option>
        {insumos.map((insumo) => (
          <option key={insumo.id} value={insumo.id}>
            {insumo.nombre}
          </option>
        ))}
      </select>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Tipo de ajuste</p>
        <div className="flex gap-1.5">
          {tiposAjuste.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTipoAjuste(t.key)}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold ${
                tipoAjuste === t.key
                  ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                  : 'border-[var(--border)] text-[var(--ink-soft)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0.001"
          step="0.001"
          placeholder="0"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-1/2 rounded-lg border border-[var(--border)] px-3 py-2"
        />
        <span className="text-[12px] text-[var(--ink-soft)]">
          {insumos.find((i) => i.id === insumoId)?.unidad_de_medida ?? ''}
        </span>
        {insumoId && <span className="ml-auto text-[11px] text-[var(--ink-soft)]">Disponible: {stockDisponible}</span>}
      </div>
      {excedeStock && <p className="text-[12px] text-[var(--red)]">La merma no puede ser mayor al stock disponible.</p>}

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Motivo</p>
        <div className="flex flex-wrap gap-1.5">
          {motivosAjuste.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotivo(m)}
              className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold ${
                motivo === m
                  ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                  : 'border-[var(--border)] text-[var(--ink-soft)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Nota adicional (opcional)"
        rows={2}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        className="rounded-lg border border-[var(--border)] px-3 py-2"
      />

      <p className="rounded-lg border border-dashed border-[var(--border)] p-3 text-[11px] text-[var(--ink-soft)]">
        Este ajuste queda registrado en el historial — no se puede editar, solo revertir con otro ajuste.
      </p>

      {error && <p className="text-[var(--red)]">{error}</p>}

      <button
        type="button"
        onClick={handleRegistrar}
        disabled={guardando || !insumoId || !cantidad || excedeStock}
        className="rounded-lg bg-[var(--orange)] py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
      >
        {guardando ? 'Registrando…' : 'Registrar ajuste'}
      </button>
    </div>
  )
}
