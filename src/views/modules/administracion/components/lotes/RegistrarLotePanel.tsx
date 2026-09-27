import type { InsumoAdmin } from '../../../../../models/types'
import { formatearMoneda } from '../constants'
import { BotonGuardar, Campo, FilaCampos, NotaInfo, PanelLateral } from '../comunes'

export function RegistrarLotePanel({ insumo }: { insumo: InsumoAdmin }) {
  return (
    <PanelLateral titulo="Registrar nuevo lote" subtitulo={`Entrada de inventario · ${insumo.nombre}`}>
      <FilaCampos>
        <Campo label="Cantidad recibida">30</Campo>
        <Campo label="Unidad" apagado>
          {insumo.unidad}
        </Campo>
      </FilaCampos>
      <FilaCampos>
        <Campo label="Fecha de ingreso">07/09/2026</Campo>
        <Campo label="Fecha de vencimiento">14/09/2026</Campo>
      </FilaCampos>
      <FilaCampos>
        <Campo label="Costo unitario">{formatearMoneda(insumo.costoUnitario)}</Campo>
        <Campo label="Proveedor">{insumo.proveedor}</Campo>
      </FilaCampos>
      <Campo label="Nota (opcional)" apagado>
        Ej: entrega parcial, empaque dañado...
      </Campo>

      <NotaInfo>
        Al registrar el lote, el stock de este insumo se actualiza automáticamente y queda en cola según su fecha de
        vencimiento (FEFO).
      </NotaInfo>

      <BotonGuardar>Registrar entrada de lote</BotonGuardar>
    </PanelLateral>
  )
}
