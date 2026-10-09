import type { MesaVista } from './MapaMesas'

interface DetalleMesaPanelProps {
  mesas: MesaVista[]
  seleccionada: string | null
  onSeleccionar: (id: string) => void
  onVolver: () => void
  onAbrirMesa: (mesa: MesaVista) => void
  onAtender: (mesa: MesaVista) => void
  onMarcarLibre: (mesa: MesaVista) => void
  onVerPedido: (mesa: MesaVista) => void
  onCobrarYCerrar: (mesa: MesaVista) => void
}

export function DetalleMesaPanel({
  mesas,
  seleccionada,
  onSeleccionar,
  onVolver,
  onAbrirMesa,
  onAtender,
  onMarcarLibre,
  onVerPedido,
  onCobrarYCerrar,
}: DetalleMesaPanelProps) {
  const mesa = mesas.find((m) => m.id === seleccionada)

  if (!mesa) {
    const misMesas = mesas.filter((m) => m.estado === 'mia')
    const sinAtender = mesas.filter((m) => m.estado === 'sin_atender')

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        {sinAtender.length > 0 && (
          <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/60 p-3">
            <p className="text-sm font-semibold text-sky-800">Pedidos por QR sin atender</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sinAtender.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => onSeleccionar(m.id)}
                  className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-bold text-sky-700"
                >
                  Mesa {m.numero} · {m.tiempoLabel}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="font-semibold text-gray-900">Tus mesas abiertas</p>
        <p className="mb-3 text-xs text-gray-500">{misMesas.length} mesas</p>

        <div className="divide-y divide-gray-100">
          {misMesas.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => onSeleccionar(m.id)}
              className="flex w-full items-center justify-between py-3 text-left first:pt-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-extrabold text-orange-600">
                  {m.numero}
                </div>
                <div className="text-sm font-semibold text-gray-900">Mesa {m.numero}</div>
              </div>
              <div className="text-[11px] text-gray-400">{m.tiempoLabel}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <button type="button" onClick={onVolver} className="mb-3 text-xs font-bold text-gray-500">
        ← Tus mesas abiertas
      </button>
      <p className="font-semibold text-gray-900">Mesa {mesa.numero}</p>

      {mesa.estado === 'libre' && (
        <div className="space-y-3 mt-3">
          <div className="rounded-lg border border-dashed border-gray-200 bg-orange-50/40 p-3 text-xs text-gray-500">
            Esta mesa está libre — puedes abrirla y empezar a tomar el pedido.
          </div>
          <button
            type="button"
            onClick={() => onAbrirMesa(mesa)}
            className="w-full rounded-xl bg-orange-500 py-3 text-center text-sm font-bold text-white hover:bg-orange-600 transition-colors"
          >
            Abrir mesa y tomar pedido
          </button>
        </div>
      )}

      {mesa.estado === 'por_limpiar' && (
        <div className="space-y-3 mt-3">
          <div className="rounded-lg border border-dashed border-gray-200 bg-orange-50/40 p-3 text-xs text-gray-500">
            La cuenta ya se cerró — esta mesa está pendiente de limpieza antes de volver a usarse.
          </div>
          <button
            type="button"
            onClick={() => onMarcarLibre(mesa)}
            className="w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Marcar como libre
          </button>
        </div>
      )}

      {mesa.estado === 'sin_atender' && (
        <div className="space-y-3 mt-3">
          <div>
            <div className="mb-1 text-[11px] font-semibold text-gray-500">Abierta por QR hace</div>
            <div className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold">{mesa.tiempoLabel}</div>
          </div>
          <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/50 p-3 text-xs text-gray-500">
            El cliente abrió esta mesa con el QR y ya pidió a cocina, pero ningún mesonero la atiende todavía.
            Al atenderla queda a tu nombre: podrás agregar platos y cerrar la cuenta.
          </div>
          <button
            type="button"
            onClick={() => onAtender(mesa)}
            className="w-full rounded-xl bg-orange-500 py-3 text-center text-sm font-bold text-white hover:bg-orange-600 transition-colors"
          >
            Atender esta mesa
          </button>
        </div>
      )}

      {mesa.estado === 'otro' && (
        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-[11px] font-semibold text-gray-500">Mesonero asignado</div>
              <div className="rounded-lg bg-orange-50/60 px-3 py-2 text-sm font-semibold">{mesa.mesero ?? '—'}</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold text-gray-500">Tiempo abierta</div>
              <div className="rounded-lg bg-orange-50/60 px-3 py-2 text-sm font-semibold">{mesa.tiempoLabel}</div>
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-gray-200 bg-orange-50/40 p-3 text-xs text-gray-500">
            Esta mesa la está atendiendo otro mesonero — no puedes tomar su pedido desde aquí.
          </div>
        </div>
      )}

      {mesa.estado === 'mia' && (
        <div className="space-y-3 mt-3">
          <div>
            <div className="mb-1 text-[11px] font-semibold text-gray-500">Tiempo abierta</div>
            <div className="rounded-lg bg-orange-50/60 px-3 py-2 text-sm font-semibold">{mesa.tiempoLabel}</div>
          </div>
          <button
            type="button"
            onClick={() => onVerPedido(mesa)}
            className="w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Ver / editar pedido
          </button>
          <button
            type="button"
            onClick={() => onCobrarYCerrar(mesa)}
            className="w-full rounded-xl bg-green-600 py-3 text-center text-sm font-bold text-white hover:bg-green-700 transition-colors"
          >
            Cobrar y cerrar cuenta
          </button>
        </div>
      )}
    </div>
  )
}
