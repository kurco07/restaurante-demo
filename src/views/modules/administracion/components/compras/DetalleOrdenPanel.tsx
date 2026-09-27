import { Fragment } from 'react'
import type { EstadoOrdenCompra, OrdenCompra } from '../../../../../models/types'
import { totalOrden } from '../../../../../controllers/administracion/useCompras'
import { formatearMoneda } from '../constants'
import { BotonGuardar, Campo, FilaCampos, NotaInfo, PanelLateral } from '../comunes'

const pasos: { estado: EstadoOrdenCompra; label: string }[] = [
  { estado: 'borrador', label: 'Borrador' },
  { estado: 'pendiente', label: 'Pendiente' },
  { estado: 'aprobada', label: 'Aprobada' },
  { estado: 'recibida', label: 'Recibida' },
]

// Una orden de compra nunca se ejecuta sola: siempre necesita que un humano
// la apruebe (ver `aprobada_por` en ordenes_compra y CLAUDE.md).
export function DetalleOrdenPanel({ orden }: { orden: OrdenCompra }) {
  return (
    <PanelLateral titulo={`Orden ${orden.codigo}`} subtitulo={`${orden.proveedor} · Solicitada por ${orden.solicitadaPor}`}>
      {orden.estado === 'rechazada' ? (
        <div className="mb-[18px] rounded-[10px] bg-[var(--red-bg)] px-3 py-2.5 text-xs font-bold text-[var(--red)]">
          Esta orden fue rechazada
        </div>
      ) : (
        <FlujoOrden estado={orden.estado} />
      )}

      <FilaCampos>
        <Campo label="Fecha de solicitud" apagado>
          {orden.fechaSolicitud}
        </Campo>
        <Campo label="Entrega estimada" apagado>
          {orden.entregaEstimada}
        </Campo>
      </FilaCampos>

      <div className="divide-y divide-[var(--border)]">
        {orden.items.map((item) => (
          <div key={item.insumo} className="flex justify-between gap-2 py-[9px] text-[12.5px]">
            <span className="font-semibold">{item.insumo}</span>
            <span className="text-[var(--ink-soft)]">
              {item.cantidad} {item.unidad} × {formatearMoneda(item.costoUnitario)}
            </span>
            <span className="font-bold">{formatearMoneda(item.cantidad * item.costoUnitario)}</span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between border-t border-[var(--border)] pt-3 text-base font-bold">
        <span>Total de la orden</span>
        <span className="text-[var(--orange-dark)]">{formatearMoneda(totalOrden(orden))}</span>
      </div>

      <AccionesSegunEstado estado={orden.estado} />
    </PanelLateral>
  )
}

function FlujoOrden({ estado }: { estado: EstadoOrdenCompra }) {
  const actual = pasos.findIndex((p) => p.estado === estado)

  return (
    <div className="mb-[18px] flex items-center">
      {pasos.map((paso, i) => (
        <Fragment key={paso.estado}>
          {i > 0 && <div className={`mx-1 mb-[18px] h-0.5 flex-1 ${i <= actual ? 'bg-[var(--green)]' : 'bg-[var(--border)]'}`} />}
          <div
            className={`flex shrink-0 flex-col items-center gap-1.5 text-[10px] font-bold ${
              i === actual ? 'text-[var(--orange-dark)]' : 'text-[var(--ink-soft)]'
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full ${
                i === actual && estado !== 'recibida'
                  ? 'bg-[var(--orange)] shadow-[0_0_0_3px_var(--orange-bg)]'
                  : i <= actual
                    ? 'bg-[var(--green)]'
                    : 'bg-[var(--border)]'
              }`}
            />
            {paso.label}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

function AccionesSegunEstado({ estado }: { estado: EstadoOrdenCompra }) {
  if (estado === 'pendiente') {
    return (
      <>
        <div className="mt-3.5">
          <Campo label="Comentario de aprobación (opcional)" apagado>
            Ej: aprobado con ajuste de cantidad...
          </Campo>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2.5">
          <button type="button" className="rounded-xl bg-[var(--green)] p-[13px] text-[13.5px] font-bold text-white">
            ✓ Aprobar orden
          </button>
          <button type="button" className="rounded-xl bg-[var(--red-bg)] p-[13px] text-[13.5px] font-bold text-[var(--red)]">
            ✕ Rechazar
          </button>
        </div>
      </>
    )
  }
  if (estado === 'borrador') return <BotonGuardar>Enviar a aprobación</BotonGuardar>
  if (estado === 'aprobada') return <BotonGuardar>Registrar recepción</BotonGuardar>
  if (estado === 'recibida') {
    return (
      <div className="mt-3.5">
        <NotaInfo>Mercancía recibida — el stock se sumó como lote nuevo en cada insumo.</NotaInfo>
      </div>
    )
  }
  return null
}
