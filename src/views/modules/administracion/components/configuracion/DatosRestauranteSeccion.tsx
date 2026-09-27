import type { DatosRestaurante } from '../../../../../models/types'
import { Campo, FilaCampos } from '../comunes'
import { SeccionConfig } from './SeccionConfig'

export function DatosRestauranteSeccion({ datos }: { datos: DatosRestaurante }) {
  return (
    <SeccionConfig titulo="Datos del restaurante" subtitulo="Esta información aparece en la app pública y en los recibos">
      <Campo label="Nombre del restaurante">{datos.nombre}</Campo>
      <Campo label="Dirección">{datos.direccion}</Campo>
      <FilaCampos>
        <Campo label="Teléfono">{datos.telefono}</Campo>
        <Campo label="Horario de atención">{datos.horario}</Campo>
      </FilaCampos>
    </SeccionConfig>
  )
}
