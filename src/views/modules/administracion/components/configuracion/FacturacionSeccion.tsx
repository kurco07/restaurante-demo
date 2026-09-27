import type { Facturacion } from '../../../../../models/types'
import { Campo } from '../comunes'
import { SeccionConfig } from './SeccionConfig'

interface FacturacionSeccionProps {
  facturacion: Facturacion
  metodosPago: string[]
  pagosActivos: Set<string>
  onAlternarPago: (metodo: string) => void
}

export function FacturacionSeccion({ facturacion, metodosPago, pagosActivos, onAlternarPago }: FacturacionSeccionProps) {
  return (
    <SeccionConfig titulo="Facturación" subtitulo="Moneda, impuestos y formas de pago aceptadas">
      <div className="grid grid-cols-3 gap-2.5">
        <Campo label="Moneda">{facturacion.moneda}</Campo>
        <Campo label="Impuesto (IVA)">{facturacion.impuesto}%</Campo>
        <Campo label="Propina sugerida">{facturacion.propinaSugerida}%</Campo>
      </div>

      <div className="mb-[5px] text-[11.5px] font-semibold text-[var(--ink-soft)]">Métodos de pago aceptados</div>
      <div className="flex flex-wrap gap-2">
        {metodosPago.map((metodo) => {
          const activo = pagosActivos.has(metodo)
          return (
            <button
              key={metodo}
              type="button"
              aria-pressed={activo}
              onClick={() => onAlternarPago(metodo)}
              className={`rounded-full border px-[15px] py-2 text-[12.5px] font-semibold ${
                activo
                  ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
              }`}
            >
              {metodo}
            </button>
          )
        })}
      </div>
    </SeccionConfig>
  )
}
