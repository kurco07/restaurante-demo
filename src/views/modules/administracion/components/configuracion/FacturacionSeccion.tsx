import { useState } from 'react'
import type { SedeConfig } from '../../../../../models/types'
import { SeccionConfig } from './SeccionConfig'

interface FacturacionSeccionProps {
  sede: SedeConfig
  onGuardar: (cambios: Partial<SedeConfig>) => Promise<void>
}

// Los 3 métodos son los mismos que ya usa el cierre de cuenta del
// mesonero (CierreCuentaModal.tsx) — de solo lectura acá a propósito:
// volverlos editables significaría tocar el flujo real de cobro, fuera
// de "lo básico" (ver plan). La moneda queda fija y sin editor: sigue
// pendiente a propósito (nota en la migración 0002).
const METODOS_PAGO_REALES = ['Efectivo', 'Tarjeta', 'Pago móvil']

export function FacturacionSeccion({ sede, onGuardar }: FacturacionSeccionProps) {
  const [impuesto, setImpuesto] = useState(String(sede.impuesto_porcentaje))
  const [propina, setPropina] = useState(String(sede.propina_sugerida_pct))
  const [estado, setEstado] = useState<'inactivo' | 'guardando' | 'guardado' | 'error'>('inactivo')

  async function guardar() {
    setEstado('guardando')
    try {
      await onGuardar({
        impuesto_porcentaje: Number(impuesto) || 0,
        propina_sugerida_pct: Number(propina) || 0,
      })
      setEstado('guardado')
    } catch {
      setEstado('error')
    }
  }

  return (
    <SeccionConfig titulo="Facturación" subtitulo="Impuesto y propina sugerida de esta sede">
      <div className="grid grid-cols-3 gap-2.5">
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
          Moneda
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm font-normal text-[var(--ink-soft)]">
            USD ($)
          </div>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
          Impuesto (%)
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={impuesto}
            onChange={(e) => setImpuesto(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
          Propina sugerida (%)
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={propina}
            onChange={(e) => setPropina(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
          />
        </label>
      </div>

      <div className="mt-4">
        <div className="mb-[5px] text-[11.5px] font-semibold text-[var(--ink-soft)]">
          Métodos de pago aceptados (los que ya usa el mesonero al cerrar cuenta)
        </div>
        <div className="flex flex-wrap gap-2">
          {METODOS_PAGO_REALES.map((metodo) => (
            <span
              key={metodo}
              className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-[15px] py-2 text-[12.5px] font-semibold text-[var(--ink-soft)]"
            >
              {metodo}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={estado === 'guardando'}
          className="w-fit rounded-lg bg-[var(--orange)] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {estado === 'guardando' ? 'Guardando…' : 'Guardar facturación'}
        </button>
        {estado === 'guardado' && <span className="text-xs font-semibold text-[var(--green)]">Guardado</span>}
        {estado === 'error' && <span className="text-xs font-semibold text-[var(--red)]">No se pudo guardar</span>}
      </div>
    </SeccionConfig>
  )
}
