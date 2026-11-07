import { useState } from 'react'
import { useAhora } from '../../../../controllers/useAhora'
import { useSincronizado } from '../../../../controllers/useSincronizado'
import { PrimeraSincronizacion } from '../../../components/ui/PrimeraSincronizacion'
import {
  agruparPlatosIguales,
  useCocina,
  ETIQUETA_ESTADO,
  ACCION_SEGUN_ESTADO,
  type EstadoItemCocina,
  type ItemCocina,
  type TicketCocina,
} from '../../../../controllers/cocina/useCocina'
import { OrderDetailModal } from './OrderDetailModal'
import { RecetaModal } from './RecetaModal'

type Filtro = 'todos' | EstadoItemCocina

const filtros: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'En espera' },
  { key: 'en_preparacion', label: 'En preparación' },
  { key: 'listo', label: 'Listos' },
]

const puntoColor: Record<EstadoItemCocina, string> = {
  pendiente: 'bg-gray-400',
  en_preparacion: 'bg-orange-500',
  listo: 'bg-green-500',
}

const botonColor: Record<EstadoItemCocina, string> = {
  pendiente: 'bg-orange-500 text-white',
  en_preparacion: 'bg-green-600 text-white',
  listo: 'border border-gray-200 bg-orange-50 text-gray-600',
}

function minutosDesde(creadoEnIso: string, ahora: number) {
  return Math.max(0, Math.round((ahora - new Date(creadoEnIso).getTime()) / 60000))
}

// Alertas de demora (arquitectura.md §4.2): minutos desde que se pidió el
// plato más antiguo del ticket. Umbrales fijos como punto de partida; los
// tickets "listo" no cuentan, ya salieron de los fogones.
const MINUTOS_DEMORA = 10
const MINUTOS_DEMORA_GRAVE = 20

type Demora = 'ok' | 'demora' | 'grave'

function demoraDe(ticket: TicketCocina, ahora: number): Demora {
  if (ticket.estado === 'listo' || ticket.items.every((i) => i.anulado)) return 'ok'
  const minutos = minutosDesde(ticket.creadoEn, ahora)
  if (minutos >= MINUTOS_DEMORA_GRAVE) return 'grave'
  if (minutos >= MINUTOS_DEMORA) return 'demora'
  return 'ok'
}

// La tarjeta siempre es blanca: la demora se marca solo con el borde y el
// color del tiempo
const bordeDemora: Record<Demora, string> = {
  ok: 'border-gray-200 bg-white',
  demora: 'border-amber-400 bg-white',
  grave: 'border-red-500 bg-white',
}

const tiempoDemora: Record<Demora, string> = {
  ok: 'text-gray-500',
  demora: 'text-amber-700',
  grave: 'text-red-600',
}

function ticketKey(ticket: TicketCocina) {
  return `${ticket.sesionId}::${ticket.estado}`
}

export function TableroCocina() {
  const { tickets, filtro, setFiltro, contador, resumen, avanzarEstado, avanzandoId, confirmarAnulados } = useCocina()
  const sincronizado = useSincronizado()
  const [ticketAbiertoKey, setTicketAbiertoKey] = useState<string | null>(null)
  const [itemReceta, setItemReceta] = useState<ItemCocina | null>(null)
  // Pantalla fija: los minutos y las alertas avanzan solos
  const ahora = useAhora(30_000)

  const ticketAbierto: TicketCocina | null = tickets.find((t) => ticketKey(t) === ticketAbiertoKey) ?? null
  const secciones: EstadoItemCocina[] = ['pendiente', 'en_preparacion', 'listo']

  return (
    <div className="mx-auto max-w-305">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b-2 border-gray-100">
        <div className="flex flex-wrap gap-1">
          {filtros.map((f) => {
            const count = contador(f.key)
            const activo = filtro === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFiltro(f.key)}
                className={`-mb-0.5 flex items-center gap-2 border-b-[3px] px-4 py-2.5 text-sm font-bold ${
                  activo ? 'border-[var(--orange)] text-[var(--orange-dark)]' : 'border-transparent text-gray-500'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11.5px] ${
                    activo ? 'bg-[var(--orange)] text-white' : 'bg-[var(--orange-bg)] text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <p className="pb-2.5 text-[11px] font-semibold text-gray-500">
          <span className="text-amber-700">Ámbar: más de {MINUTOS_DEMORA} min</span> ·{' '}
          <span className="text-red-600">Rojo: más de {MINUTOS_DEMORA_GRAVE} min</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_250px]">
        <div>
          {tickets.length === 0 && !sincronizado ? (
            <PrimeraSincronizacion />
          ) : tickets.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No hay pedidos pendientes en cocina.</p>
          ) : (
            secciones
              .filter((s) => filtro === 'todos' || filtro === s)
              .map((seccion) => {
                const ticketsSeccion = tickets.filter((t) => t.estado === seccion)
                if (ticketsSeccion.length === 0) return null
                return (
                  <div key={seccion} className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${puntoColor[seccion]}`} />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-gray-800">
                        {ETIQUETA_ESTADO[seccion]}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">· {ticketsSeccion.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                      {ticketsSeccion.map((ticket) => {
                        const demora = demoraDe(ticket, ahora)
                        const hayAnulados = ticket.items.some((i) => i.anulado)
                        const todoAnulado = ticket.items.every((i) => i.anulado)
                        return (
                          <div
                            key={ticketKey(ticket)}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setTicketAbiertoKey(ticketKey(ticket))
                              setItemReceta(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setTicketAbiertoKey(ticketKey(ticket))
                                setItemReceta(null)
                              }
                            }}
                            className={`flex cursor-pointer flex-col rounded-2xl border-[1.5px] p-4 text-left shadow-sm transition-shadow hover:shadow-md ${bordeDemora[demora]}`}
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[15.5px] font-extrabold text-gray-900">Mesa {ticket.mesa}</span>
                              <span className={`text-[13px] font-bold ${tiempoDemora[demora]}`}>
                                {demora === 'grave' && '⚠ '}
                                {minutosDesde(ticket.creadoEn, ahora)} min
                              </span>
                            </div>
                            <div className="mb-2.5 text-[11px] text-gray-500">
                              Mesonero: {ticket.mesonero ?? 'Sin mesonero (pedido por QR)'}
                            </div>
                            <ul className="mb-3 text-sm">
                              {agruparPlatosIguales(ticket.items).map((item) =>
                                item.anulado ? (
                                  <li key={item.id} className="py-0.5">
                                    <span className="text-gray-400 line-through">
                                      <span className="mr-1.5 font-extrabold">{item.cantidad}×</span>
                                      {item.plato}
                                    </span>
                                    <span className="ml-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                                      ANULADO
                                    </span>
                                    {item.motivoAnulacion && (
                                      <div className="text-[10.5px] font-semibold text-red-600">{item.motivoAnulacion}</div>
                                    )}
                                  </li>
                                ) : (
                                  <li key={item.id} className="py-0.5">
                                    <span className="mr-1.5 font-extrabold text-[var(--orange-dark)]">{item.cantidad}×</span>
                                    {item.plato}
                                    {item.notas && <div className="text-[10.5px] italic text-gray-500">{item.notas}</div>}
                                  </li>
                                ),
                              )}
                            </ul>
                            <div className="mt-auto flex flex-col gap-2">
                              {hayAnulados && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void confirmarAnulados(ticket)
                                  }}
                                  className="w-full rounded-lg border border-red-300 bg-red-50 py-2.5 text-center text-[13px] font-bold text-red-700"
                                >
                                  Entendido, quitar anulados
                                </button>
                              )}
                              {!todoAnulado && (
                                <button
                                  type="button"
                                  disabled={avanzandoId === ticketKey(ticket)}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    avanzarEstado(ticket)
                                  }}
                                  className={`w-full rounded-lg py-2.5 text-center text-[13px] font-bold disabled:opacity-50 ${botonColor[seccion]}`}
                                >
                                  {avanzandoId === ticketKey(ticket) ? 'Actualizando…' : ACCION_SEGUN_ESTADO[seccion]}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
          )}
        </div>

        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-4.5">
          <p className="mb-1 text-base font-extrabold text-gray-900">Resumen global</p>
          <p className="mb-3.5 text-[11.5px] text-gray-500">Pendientes en toda la cocina</p>
          {resumen.map(([plato, cantidad]) => (
            <div key={plato} className="flex justify-between border-t border-gray-100 py-2 text-sm first:border-none">
              <span className="text-gray-700">{plato}</span>
              <span className="font-extrabold text-[var(--orange-dark)]">{cantidad}×</span>
            </div>
          ))}
        </div>
      </div>

      {ticketAbierto && !itemReceta && (
        <OrderDetailModal
          ticket={ticketAbierto}
          avanzando={avanzandoId === ticketKey(ticketAbierto)}
          onCerrar={() => setTicketAbiertoKey(null)}
          onVerReceta={(item) => setItemReceta(item)}
          onAvanzarEstado={() => avanzarEstado(ticketAbierto)}
          onConfirmarAnulados={() => void confirmarAnulados(ticketAbierto)}
        />
      )}

      {itemReceta && (
        <RecetaModal
          menuItemId={itemReceta.menuItemId}
          plato={itemReceta.plato}
          onVolver={() => setItemReceta(null)}
          onCerrar={() => {
            setItemReceta(null)
            setTicketAbiertoKey(null)
          }}
        />
      )}
    </div>
  )
}
