import { useNavigate } from 'react-router-dom'
import type { MesaMock } from './MapaMesas'

interface DetalleMesaPanelProps {
  mesas: MesaMock[]
  seleccionada: number | null
  onSeleccionar: (numero: number) => void
  onVolver: () => void
}

const etiquetaEstado: Record<NonNullable<MesaMock['status']>, string> = {
  cocina: 'En cocina',
  listo: 'Listo para servir',
  cuenta: 'Cuenta pedida',
}

const claseChip: Record<NonNullable<MesaMock['status']>, string> = {
  cocina: 'bg-orange-50 text-orange-600',
  listo: 'bg-green-50 text-green-600',
  cuenta: 'bg-red-50 text-red-600',
}

export function DetalleMesaPanel({ mesas, seleccionada, onSeleccionar, onVolver }: DetalleMesaPanelProps) {
  const navigate = useNavigate()
  const mesa = mesas.find((m) => m.numero === seleccionada)

  const irATomaPedidos = (numero: number) => {
    navigate(`/mesoneros/pedidos/${numero}`)
  }

  if (!mesa) {
    const misPedidos = mesas.filter((m) => m.estado === 'mia')

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="font-semibold text-gray-900">Tus pedidos activos</p>
        <p className="mb-3 text-xs text-gray-500">{misPedidos.length} mesas — ordenadas por lo más urgente</p>

        <div className="divide-y divide-gray-100">
          {misPedidos.map((m) => (
            <button
              type="button"
              key={m.numero}
              onClick={() => onSeleccionar(m.numero)}
              className="flex w-full items-center justify-between py-3 text-left first:pt-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-extrabold text-orange-600">
                  {m.numero}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Mesa {m.numero}</div>
                  <div className="text-xs text-gray-500">{m.items} ítems</div>
                </div>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${claseChip[m.status ?? 'cocina']}`}>
                  {etiquetaEstado[m.status ?? 'cocina']}
                </span>
                <div className="mt-1 text-[11px] text-gray-400">{m.tiempo}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <button type="button" onClick={onVolver} className="mb-3 text-xs font-bold text-gray-500">
        ← Tus pedidos activos
      </button>
      <p className="font-semibold text-gray-900">Mesa {mesa.numero}</p>
      <p className="mb-3 text-xs text-gray-500">{mesa.zona}</p>

      {mesa.estado === 'libre' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-dashed border-gray-200 bg-orange-50/40 p-3 text-xs text-gray-500">
            Esta mesa está libre — puedes abrirla y empezar a tomar el pedido.
          </div>
          <button
            type="button"
            onClick={() => irATomaPedidos(mesa.numero)}
            className="rounded-xl bg-orange-500 py-3 text-center text-sm font-bold text-white hover:bg-orange-600 transition-colors"
          >
            Abrir mesa y tomar pedido
          </button>
        </div>
      )}

      {mesa.estado === 'limpiar' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-dashed border-gray-200 bg-orange-50/40 p-3 text-xs text-gray-500">
            La cuenta ya se cerró — esta mesa está pendiente de limpieza antes de volver a usarse.
          </div>
          <div className="rounded-xl border border-gray-200 py-3 text-center text-sm font-bold text-gray-700">
            Marcar como libre
          </div>
        </div>
      )}

      {mesa.estado === 'otro' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-[11px] font-semibold text-gray-500">Mesonero asignado</div>
              <div className="rounded-lg bg-orange-50/60 px-3 py-2 text-sm font-semibold">{mesa.mesero}</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold text-gray-500">Tiempo abierta</div>
              <div className="rounded-lg bg-orange-50/60 px-3 py-2 text-sm font-semibold">{mesa.tiempo}</div>
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-gray-200 bg-orange-50/40 p-3 text-xs text-gray-500">
            Esta mesa la está atendiendo otro mesonero — no puedes tomar su pedido desde aquí.
          </div>
        </div>
      )}

      {mesa.estado === 'mia' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-[11px] font-semibold text-gray-500">Tiempo abierta</div>
              <div className="rounded-lg bg-orange-50/60 px-3 py-2 text-sm font-semibold">
                {mesa.tiempo}
                {mesa.demorada ? ' — demorada' : ''}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold text-gray-500">Ítems</div>
              <div className="rounded-lg bg-orange-50/60 px-3 py-2 text-sm font-semibold">{mesa.items}</div>
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold text-gray-500">Total acumulado</div>
            <div className="rounded-lg bg-orange-50/60 px-3 py-2 text-sm font-semibold">
              ${mesa.total?.toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-gray-200 bg-orange-50/40 p-3 text-xs text-gray-500">
            <strong className="text-gray-700">{etiquetaEstado[mesa.status ?? 'cocina']}</strong>
            {mesa.demorada ? ' — por encima del tiempo esperado.' : '.'}
          </div>
          <div className="rounded-xl border border-gray-200 py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => irATomaPedidos(mesa.numero)}
          >
            Ver / editar pedido
          </div>
          <div className="rounded-xl bg-green-600 py-3 text-center text-sm font-bold text-white">
            Cobrar y cerrar cuenta
          </div>
        </div>
      )}
    </div>
  )
}
