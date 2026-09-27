import type { ColorMarca } from '../../../../../models/types'
import { SeccionConfig } from './SeccionConfig'

export function ColoresMarcaSeccion({ colores }: { colores: ColorMarca[] }) {
  return (
    <SeccionConfig titulo="Colores de marca" subtitulo="Se usan en la app pública, en el menú digital y en los recibos">
      <div className="flex flex-wrap gap-4">
        {colores.map((color) => (
          <div key={color.hex} className="flex items-center gap-2.5">
            <div
              className="h-[34px] w-[34px] shrink-0 rounded-[10px] border border-[#d8ccb8]"
              style={{ background: color.hex }}
            />
            <div>
              <div className="text-[12.5px] font-bold">{color.nombre}</div>
              <div className="text-[11px] text-[var(--ink-soft)]">{color.hex}</div>
            </div>
          </div>
        ))}
      </div>
    </SeccionConfig>
  )
}
