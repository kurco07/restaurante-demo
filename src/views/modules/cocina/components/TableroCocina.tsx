import { useState } from 'react'
import {
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

function tiempoTranscurrido(creadoEnIso: string) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(creadoEnIso).getTime()) / 60000))
  return `${minutos} min`
}

function ticketKey(ticket: TicketCocina) {
  return `${ticket.sesionId}::${ticket.estado}`
}

export function TableroCocina() {
  const { tickets, filtro, setFiltro, contador, resumen, avanzarEstado, avanzandoId } = useCocina()
  const [ticketAbiertoKey, setTicketAbiertoKey] = useState<string | null>(null)
  const [itemReceta, setItemReceta] = useState<ItemCocina | null>(null)

  const ticketAbierto: TicketCocina | null = tickets.find((t) => ticketKey(t) === ticketAbiertoKey) ?? null
  const secciones: EstadoItemCocina[] = ['pendiente', 'en_preparacion', 'listo']

  return (
    <div className="mx-auto max-w-305 p-7">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Cocina</h1>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 border-b-2 border-gray-100">
        {filtros.map((f) => {
          const count = contador(f.key)
          const activo = filtro === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFiltro(f.key)}
              className={`-mb-0.5 flex items-center gap-2 border-b-[3px] px-4 py-2.5 text-sm font-bold ${
                activo ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[11.5px] ${
                  activo ? 'bg-orange-500 text-white' : 'bg-orange-50 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_250px]">
        <div>
          {tickets.length === 0 ? (
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
                      {ticketsSeccion.map((ticket) => (
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
                          className="cursor-pointer rounded-2xl border-[1.5px] border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[15.5px] font-extrabold text-gray-900">Mesa {ticket.mesa}</span>
                            <span className="text-[13px] font-bold text-gray-500">{tiempoTranscurrido(ticket.creadoEn)}</span>
                          </div>
                          <div className="mb-2.5 text-[11px] text-gray-500">
                            Mesonero: {ticket.mesonero ?? 'Sin asignar'}
                          </div>
                          <ul className="mb-3 text-sm">
                            {ticket.items.map((item) => (
                              <li key={item.id} className="py-0.5">
                                <span className="mr-1.5 font-extrabold text-orange-600">{item.cantidad}×</span>
                                {item.plato}
                                {item.notas && <div className="text-[10.5px] italic text-gray-500">{item.notas}</div>}
                              </li>
                            ))}
                          </ul>
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
                        </div>
                      ))}
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
              <span className="font-extrabold text-orange-600">{cantidad}×</span>
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
