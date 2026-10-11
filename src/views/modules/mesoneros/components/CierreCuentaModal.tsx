import { useMemo, useState } from 'react'
import { usePowerSyncWatch } from '../../../../controllers/usePowerSyncWatch'
import { cerrarCuenta } from '../../../../models/services/cierreCuentaService'
import type { Usuario } from '../../../../models/types'
import type { MesaVista } from './MapaMesas'

interface SesionRow {
  id: string
}

interface ItemRow {
  id: string
  cantidad: number
  precioUnitario: number
  nombre: string
  estado: string
}

const SQL_SESION =
  "select id from sesiones_mesa where mesa_id = ? and estado = 'abierta' order by abierta_en desc limit 1"

const SQL_ITEMS = `
  select
    pi.id as id,
    pi.cantidad as cantidad,
    pi.precio_unitario as precioUnitario,
    pi.estado as estado,
    mi.nombre as nombre
  from pedidos_items pi
  join menu_items mi on mi.id = pi.menu_item_id
  where pi.sesion_id = ?
  order by pi.creado_en
`

const ESTADOS_LISTOS = new Set(['listo', 'entregado'])

const PROPINA_OPCIONES = [0.1, 0.15, 0.2] as const

const METODOS: { key: 'efectivo' | 'tarjeta' | 'pago_movil'; label: string }[] = [
  { key: 'efectivo', label: 'Efectivo' },
  { key: 'tarjeta', label: 'Tarjeta de crédito/débito' },
  { key: 'pago_movil', label: 'Pago móvil / transferencia' },
]

interface CierreCuentaModalProps {
  mesa: MesaVista
  usuario: Usuario
  onCerrar: () => void
  onCerrada: () => void
}

export function CierreCuentaModal({ mesa, usuario, onCerrar, onCerrada }: CierreCuentaModalProps) {
  const sesiones = usePowerSyncWatch<SesionRow>(SQL_SESION, [mesa.id])
  const sesion = sesiones[0] as SesionRow | undefined
  const items = usePowerSyncWatch<ItemRow>(SQL_ITEMS, [sesion?.id ?? ''])

  const [propinaPct, setPropinaPct] = useState<number | 'otro'>(0.15)
  const [propinaManual, setPropinaManual] = useState('')
  const [metodo, setMetodo] = useState<'efectivo' | 'tarjeta' | 'pago_movil'>('tarjeta')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0), [items])
  const propina = propinaPct === 'otro' ? Number(propinaManual) || 0 : subtotal * propinaPct
  const total = subtotal + propina

  // No se puede cerrar con comida que cocina todavía no marcó como lista
  // — decisión confirmada con el usuario: en mesas se prepara primero y
  // se paga al final (distinto de delivery, donde sería al revés).
  const itemsSinTerminar = items.filter((i) => !ESTADOS_LISTOS.has(i.estado))

  async function confirmar() {
    if (!sesion || !usuario.sede_id || itemsSinTerminar.length > 0) return
    setEnviando(true)
    setError(null)
    try {
      await cerrarCuenta({
        tenant_id: usuario.tenant_id,
        sede_id: usuario.sede_id,
        sesion_id: sesion.id,
        mesa_id: mesa.id,
        metodo_de_pago: metodo,
        monto: subtotal,
        propina,
        cerrado_por: usuario.id,
      })
      onCerrada()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar el pago — revisa tu conexión e intenta de nuevo.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2b2118]/35 p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="max-h-[88vh] w-full max-w-[440px] overflow-y-auto rounded-[22px] bg-white p-6 shadow-[0_30px_70px_rgba(43,33,24,0.35)]">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <p className="text-[11.5px] font-extrabold uppercase tracking-wide text-orange-600">Mesa {mesa.numero}</p>
            <h2 className="text-2xl font-bold text-gray-900">Cerrar cuenta</h2>
          </div>
          <button type="button" onClick={onCerrar} className="text-lg text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="my-4 border-t border-orange-100">
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">Esta mesa no tiene ítems todavía.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex justify-between border-b border-orange-100 py-2.5 text-[13.5px]">
                <span className="font-semibold text-gray-800">
                  <span className="mr-1.5 font-extrabold text-orange-600">{item.cantidad}×</span>
                  {item.nombre}
                </span>
                <span>${(item.cantidad * item.precioUnitario).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <p className="mb-2.5 text-xs font-extrabold uppercase tracking-wide text-gray-500">Propina</p>
        <div className="flex gap-2">
          {PROPINA_OPCIONES.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setPropinaPct(pct)}
              className={`flex-1 rounded-lg border-[1.5px] py-2.5 text-[13px] font-bold ${
                propinaPct === pct ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-200 text-gray-500'
              }`}
            >
              {Math.round(pct * 100)}% · ${(subtotal * pct).toFixed(2)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPropinaPct('otro')}
            className={`flex-1 rounded-lg border-[1.5px] py-2.5 text-[13px] font-bold ${
              propinaPct === 'otro' ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-200 text-gray-500'
            }`}
          >
            Otro
          </button>
        </div>
        {propinaPct === 'otro' && (
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Monto de propina"
            value={propinaManual}
            onChange={(e) => setPropinaManual(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        )}

        <p className="mb-2.5 mt-5 text-xs font-extrabold uppercase tracking-wide text-gray-500">Método de pago</p>
        <div className="flex flex-col gap-2">
          {METODOS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetodo(m.key)}
              className={`rounded-xl border-[1.5px] px-3.5 py-3 text-left text-[13.5px] font-bold ${
                metodo === m.key ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-[13.5px] text-gray-500">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[13.5px] text-gray-500">
            <span>Propina</span>
            <span>${propina.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2.5 text-lg font-extrabold text-gray-900">
            <span>Total a cobrar</span>
            <span className="text-orange-600">${total.toFixed(2)}</span>
          </div>
        </div>

        {itemsSinTerminar.length > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Todavía hay {itemsSinTerminar.length} plato{itemsSinTerminar.length > 1 ? 's' : ''} que cocina no marcó
            como listo{itemsSinTerminar.length > 1 ? 's' : ''} — no se puede cerrar la mesa hasta que lo estén.
          </p>
        )}

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 rounded-xl border border-gray-200 bg-orange-50 py-3 text-sm font-bold text-gray-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={enviando || items.length === 0 || !sesion || itemsSinTerminar.length > 0}
            className="flex-[1.4] rounded-xl bg-orange-500 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {enviando ? 'Cerrando…' : 'Confirmar y cerrar mesa'}
          </button>
        </div>
      </div>
    </div>
  )
}
