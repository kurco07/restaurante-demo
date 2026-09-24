import { useState } from 'react'
import { ordenesMock, etiquetaEstadoOrden, accionSegunEstado, type EstadoOrden } from './ordenesMock'
import { OrderDetailModal } from './OrderDetailModal'
import { RecetaModal } from './RecetaModal'

type Filtro = 'todos' | EstadoOrden

const filtros: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'espera', label: 'En espera' },
  { key: 'prep', label: 'En preparación' },
  { key: 'listo', label: 'Listos' },
  { key: 'tarde', label: 'Tardes' },
]

const puntoColor: Record<EstadoOrden, string> = {
  espera: 'bg-gray-400',
  prep: 'bg-orange-500',
  listo: 'bg-green-500',
  tarde: 'bg-red-500',
}

const botonColor: Record<EstadoOrden, string> = {
  espera: 'bg-orange-500 text-white',
  prep: 'bg-green-600 text-white',
  listo: 'border border-gray-200 bg-orange-50 text-gray-600',
  tarde: 'bg-red-500 text-white',
}

function contarPorEstado(estado: EstadoOrden) {
  return ordenesMock.filter((o) => o.estado === estado).length
}

// Resumen global derivado de las órdenes, no hardcodeado — evita que quede
// desincronizado si se agregan/quitan pedidos de ejemplo más adelante.
function calcularResumen() {
  const totales = new Map<string, number>()
  for (const orden of ordenesMock) {
    for (const item of orden.items) {
      totales.set(item.plato, (totales.get(item.plato) ?? 0) + item.cantidad)
    }
  }
  return [...totales.entries()].sort((a, b) => b[1] - a[1])
}

export function TableroCocina() {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [ordenAbiertaId, setOrdenAbiertaId] = useState<string | null>(null)
  const [recetaPlato, setRecetaPlato] = useState<string | null>(null)

  const ordenAbierta = ordenesMock.find((o) => o.id === ordenAbiertaId) ?? null

  const secciones: EstadoOrden[] = ['espera', 'prep', 'listo', 'tarde']
  const resumen = calcularResumen()

  return (
    <div className="mx-auto max-w-305 p-7">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Cocina</h1>
        <span className="text-sm font-semibold text-gray-500">⏱ 19:15</span>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 border-b-2 border-gray-100">
        {filtros.map((f) => {
          const count = f.key === 'todos' ? ordenesMock.length : contarPorEstado(f.key)
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
          {secciones
            .filter((s) => filtro === 'todos' || filtro === s)
            .map((seccion) => {
              const ordenes = ordenesMock.filter((o) => o.estado === seccion)
              if (ordenes.length === 0) return null
              return (
                <div key={seccion} className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${puntoColor[seccion]}`} />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-800">
                      {etiquetaEstadoOrden[seccion]}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">· {ordenes.length}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                    {ordenes.map((orden) => (
                      <button
                        key={orden.id}
                        type="button"
                        onClick={() => {
                          setOrdenAbiertaId(orden.id)
                          setRecetaPlato(null)
                        }}
                        className={`rounded-2xl border-[1.5px] p-4 text-left shadow-sm transition-shadow hover:shadow-md ${
                          seccion === 'tarde' ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[15.5px] font-extrabold text-gray-900">{orden.mesa}</span>
                          <span className={`text-[13px] font-bold ${seccion === 'tarde' ? 'text-red-600' : seccion === 'listo' ? 'text-green-600' : 'text-gray-500'}`}>
                            {orden.tiempo}
                          </span>
                        </div>
                        <div className="mb-2.5 text-[11px] text-gray-500">
                          Mesonero: {orden.mesonero ?? 'Sin asignar'} · Pedido #{orden.id}
                        </div>
                        <ul className="mb-3 text-sm">
                          {orden.items.map((item, i) => (
                            <li key={i} className="py-0.5">
                              <span className="mr-1.5 font-extrabold text-orange-600">{item.cantidad}×</span>
                              {item.plato}
                              {item.mod && <div className="text-[10.5px] italic text-gray-500">{item.mod}</div>}
                            </li>
                          ))}
                        </ul>
                        <div
                          className={`w-full rounded-lg py-2.5 text-center text-[13px] font-bold ${botonColor[seccion]}`}
                        >
                          {accionSegunEstado[seccion]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
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

      {ordenAbierta && !recetaPlato && (
        <OrderDetailModal
          orden={ordenAbierta}
          onCerrar={() => setOrdenAbiertaId(null)}
          onVerReceta={(plato) => setRecetaPlato(plato)}
        />
      )}

      {recetaPlato && (
        <RecetaModal
          plato={recetaPlato}
          onVolver={() => setRecetaPlato(null)}
          onCerrar={() => {
            setRecetaPlato(null)
            setOrdenAbiertaId(null)
          }}
        />
      )}
    </div>
  )
}
