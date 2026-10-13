import type { Mesa, MesaResumen } from '../../../../../models/types'
import { PanelCard } from '../../../../components/ui/PanelCard'

interface EstadoMesasMiniProps {
  mesas: MesaResumen[]
  conteo: { ocupadas: number; libres: number; porLimpiar: number }
}

const clasePorEstado: Record<Mesa['estado'], string> = {
  ocupada: 'border-[var(--orange)] bg-[var(--orange-bg)] text-[var(--orange-dark)]',
  libre: 'border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]',
  por_limpiar: 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--ink-soft)]',
}

const leyenda: { estado: Mesa['estado']; label: string }[] = [
  { estado: 'ocupada', label: 'Ocupada' },
  { estado: 'libre', label: 'Libre' },
  { estado: 'por_limpiar', label: 'Por limpiar' },
]

export function EstadoMesasMini({ mesas, conteo }: EstadoMesasMiniProps) {
  return (
    <PanelCard titulo="Estado de mesas" subtitulo="Vista general del salón">
      <div className="mb-3 flex flex-wrap gap-3.5">
        {leyenda.map((l) => (
          <div key={l.estado} className="flex items-center gap-[5px] text-[11px] text-[var(--ink-soft)]">
            <div className={`h-[9px] w-[9px] rounded-[3px] border-[1.5px] ${clasePorEstado[l.estado]}`} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-6 gap-[7px]">
        {mesas.map((mesa) => (
          <div
            key={mesa.numero}
            className={`flex aspect-square items-center justify-center rounded-lg border-[1.5px] text-[11px] font-bold ${clasePorEstado[mesa.estado]}`}
          >
            {mesa.numero}
          </div>
        ))}
      </div>

      <div className="text-[11.5px] text-[var(--ink-soft)]">
        {conteo.ocupadas} ocupadas · {conteo.libres} libres · {conteo.porLimpiar} por limpiar
      </div>
    </PanelCard>
  )
}
