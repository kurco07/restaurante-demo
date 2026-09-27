import { Link } from 'react-router-dom'
import type { InsumoAdmin } from '../../../../../models/types'
import { formatearMoneda } from '../constants'
import {
  BotonGuardar,
  Campo,
  EnlaceEliminar,
  FilaCampos,
  Interruptor,
  NotaInfo,
  PanelLateral,
} from '../comunes'

export function EditorInsumo({ insumo }: { insumo: InsumoAdmin }) {
  return (
    <PanelLateral titulo="Editor de insumo" subtitulo={insumo.nombre}>
      <Campo label="Nombre del insumo">{insumo.nombre}</Campo>
      <Campo label="Categoría">{insumo.categoria}</Campo>
      <FilaCampos>
        <Campo label="Unidad de medida">{insumo.unidad}</Campo>
        <Campo label="Costo unitario">{formatearMoneda(insumo.costoUnitario)}</Campo>
      </FilaCampos>
      <Campo label="Proveedor principal">{insumo.proveedor}</Campo>
      <Campo label="Stock mínimo (alerta)">
        {insumo.stockMinimo} {insumo.unidadCorta}
      </Campo>

      <Interruptor label="Insumo activo" encendido={insumo.activo} />

      <NotaInfo>
        Stock actual:{' '}
        <strong className="text-[var(--ink)]">
          {insumo.stockActual} {insumo.unidadCorta}
        </strong>
        . Se actualiza automáticamente desde los lotes y movimientos de inventario — no se edita aquí directamente.
      </NotaInfo>

      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <p className="mb-2 text-[13px] font-bold">
          Usado en {insumo.usadoEn.length} {insumo.usadoEn.length === 1 ? 'receta' : 'recetas'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {insumo.usadoEn.map((plato) => (
            <span key={plato} className="rounded-full bg-[var(--gray-bg)] px-[11px] py-[5px] text-[11.5px] font-semibold text-[var(--ink-soft)]">
              {plato}
            </span>
          ))}
        </div>
      </div>

      <Link
        to={`/administracion/insumos/${insumo.id}/lotes`}
        className="mt-3.5 block rounded-[10px] border border-[var(--border)] p-2.5 text-center text-[12.5px] font-bold text-[var(--orange-dark)]"
      >
        Ver lotes de este insumo →
      </Link>

      <BotonGuardar>Guardar cambios</BotonGuardar>
      <EnlaceEliminar>Eliminar insumo</EnlaceEliminar>
    </PanelLateral>
  )
}
