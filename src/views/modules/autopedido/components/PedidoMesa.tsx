import type { EstadoItemPedido, ItemCarritoAutopedido, ItemPedidoCompartido } from '../../../../models/types'

interface PedidoMesaProps {
  mesa: string
  enMesa: ItemPedidoCompartido[]
  totalEnMesa: number
  cuentaCerrada: boolean
  sinConexion: boolean
  items: ItemCarritoAutopedido[]
  total: number
  onQuitar: (id: string) => void
  onEnviar: () => void
  enviando: boolean
  error: string | null
  onIrAlMenu: () => void
}

const ETIQUETA_ESTADO: Record<EstadoItemPedido, string> = {
  // Pedido por QR que el mesonero todavía no confirmó (migración 0005)
  por_aprobar: 'Esperando al mesonero',
  pendiente: 'En espera',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
}

const CLASE_ESTADO: Record<EstadoItemPedido, string> = {
  por_aprobar: 'bg-sky-50 text-sky-700',
  pendiente: 'bg-gray-100 text-gray-500',
  en_preparacion: 'bg-amber-50 text-amber-700',
  listo: 'bg-green-50 text-green-700',
  entregado: 'bg-gray-50 text-gray-400',
}

// "Tu pedido" del cliente. Arriba, lo ya pedido en la mesa compartida (lo
// del mesonero y lo pedido por QR, con su estado de cocina — Fase 3,
// Módulo 3). Abajo, el carrito por enviar (enviar_pedido_autopedido,
// Módulo 2). El cierre y el pago siempre los hace el mesonero.
export function PedidoMesa(props: PedidoMesaProps) {
  const { mesa, enMesa, items } = props

  if (enMesa.length === 0 && items.length === 0 && !props.cuentaCerrada) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-5xl">🍽️</p>
        <p className="mt-4 text-lg font-extrabold text-gray-900">Todavía no has pedido nada</p>
        <p className="mt-2 text-[13px] text-gray-500">Mesa {mesa} — ve al menú para elegir tus platos.</p>
        <button
          type="button"
          onClick={props.onIrAlMenu}
          className="mt-6 rounded-2xl bg-orange-500 px-6 py-3 text-[13px] font-bold text-white"
        >
          Ver el menú
        </button>
      </div>
    )
  }

  return (
    <div className="px-5">
      <p className="mb-3 mt-1 text-[17px] font-extrabold text-gray-900">Mesa {mesa}</p>

      {props.cuentaCerrada && (
        <p className="mb-3 rounded-[12px] bg-green-50 px-3.5 py-2.5 text-center text-[12.5px] font-semibold text-green-700">
          Tu mesonero ya cerró la cuenta de esta mesa. ¡Gracias por tu visita!
        </p>
      )}

      <Seccion titulo="Ya pedido en la mesa">
        {enMesa.length === 0 ? (
          <p className="py-4 text-center text-[12.5px] text-gray-500">Todavía no hay nada pedido en esta mesa.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {enMesa.map((item) => (
              <div key={item.id} className="rounded-[14px] border border-orange-100 bg-white px-3.5 py-2.5">
                <div className="flex justify-between gap-2 text-[13px] font-bold text-gray-900">
                  <span>
                    {item.cantidad > 1 && `${item.cantidad}× `}
                    {item.nombre}
                  </span>
                  <span>${(Number(item.precio_unitario) * item.cantidad).toFixed(2)}</span>
                </div>
                {item.notas && <div className="mt-0.5 text-[11px] text-gray-500">Nota: {item.notas}</div>}
                <div className="mt-1.5 flex items-center gap-2 text-[10.5px] font-bold">
                  <span className={`rounded-full px-2 py-0.5 ${CLASE_ESTADO[item.estado]}`}>
                    {ETIQUETA_ESTADO[item.estado]}
                  </span>
                  <span className="text-gray-400">{item.por_qr ? 'Pedido por QR' : 'Pedido con el mesonero'}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between px-1 pt-1 text-[13px] font-extrabold text-gray-900">
              <span>Total de la mesa</span>
              <span>${props.totalEnMesa.toFixed(2)}</span>
            </div>
          </div>
        )}
        {props.sinConexion && (
          <p className="mt-2 text-center text-[11px] text-gray-400">Sin conexión — mostrando lo último que vimos.</p>
        )}
      </Seccion>

      <Seccion titulo="Por enviar">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[12.5px] text-gray-500">Agrega platos desde el menú.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <div key={item.id} className="rounded-[14px] border border-orange-100 bg-white px-3.5 py-3">
                <div className="flex justify-between gap-2 text-[13.5px] font-bold text-gray-900">
                  <span>
                    {item.cantidad > 1 && `${item.cantidad}× `}
                    {item.plato.nombre}
                  </span>
                  <span>${(item.plato.precio * item.cantidad).toFixed(2)}</span>
                </div>
                {item.nota && <div className="mt-1 text-[11px] font-semibold text-orange-600">Nota: {item.nota}</div>}
                <button
                  type="button"
                  onClick={() => props.onQuitar(item.id)}
                  className="mt-1 text-[11px] font-bold text-red-500"
                >
                  Quitar
                </button>
              </div>
            ))}
            <div className="flex justify-between rounded-[14px] bg-orange-50 p-3.5 text-[15px] font-extrabold text-gray-900">
              <span>Por enviar</span>
              <span>${props.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Seccion>

      {props.error && (
        <p className="mb-3 rounded-[12px] bg-red-50 px-3.5 py-2.5 text-center text-[12.5px] font-semibold text-red-600">
          {props.error}
        </p>
      )}

      {props.cuentaCerrada ? (
        <p className="mb-4 rounded-[12px] border border-dashed border-gray-200 px-3.5 py-3 text-center text-[12.5px] text-gray-500">
          Esta mesa ya cerró su cuenta — si quieres pedir algo más, avísale a tu mesonero.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={props.onEnviar}
            disabled={items.length === 0 || props.enviando}
            className="mb-2 w-full rounded-2xl bg-orange-500 py-3.5 text-[14px] font-bold text-white disabled:opacity-50"
          >
            {props.enviando ? 'Enviando…' : 'Enviar pedido'}
          </button>
          <p className="mb-4 text-center text-[11px] text-gray-500">Para pagar, pídele la cuenta a tu mesonero.</p>
        </>
      )}
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.05em] text-gray-500">{titulo}</p>
      {children}
    </div>
  )
}
