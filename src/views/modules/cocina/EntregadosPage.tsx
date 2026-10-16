import { useState } from 'react'
import { useEntregados } from '../../../controllers/cocina/useEntregados'

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

// Entregados del turno: lo que ya salió de cocina hoy, por mesa, lo más
// reciente arriba. Solo consulta: no se puede devolver un plato a la cola.
export default function EntregadosPage() {
  const { pedidos, platos } = useEntregados()
  const [busqueda, setBusqueda] = useState('')

  const q = busqueda.trim().toLowerCase()
  const visibles = q
    ? pedidos.filter(
        (p) => p.mesa.toLowerCase().includes(q) || p.items.some((i) => i.plato.toLowerCase().includes(q)),
      )
    : pedidos

  return (
    <div className="mx-auto max-w-305">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Entregados hoy</h1>
          <p className="text-sm text-gray-500">
            {platos} plato{platos === 1 ? '' : 's'} en {pedidos.length} mesa{pedidos.length === 1 ? '' : 's'}
          </p>
        </div>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar mesa o plato…"
          className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm sm:w-64"
        />
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
          {pedidos.length === 0 ? 'Todavía no se entregó nada hoy.' : 'Nada coincide con la búsqueda.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p) => (
            <div key={p.sesionId} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[15.5px] font-extrabold text-gray-900">Mesa {p.mesa}</span>
                <span className="text-xs font-bold text-gray-500" title="Hora del último plato pedido">
                  {hora(p.pedidoEn)}
                </span>
              </div>
              <div className="mb-2.5 text-[11px] text-gray-500">
                Mesonero: {p.mesonero ?? 'Sin mesonero (pedido por QR)'}
              </div>
              <ul className="text-sm">
                {p.items.map((item) => (
                  <li key={item.id} className="py-0.5">
                    <span className="mr-1.5 font-extrabold text-green-600">{item.cantidad}×</span>
                    {item.plato}
                    {item.notas && <div className="text-[10.5px] italic text-gray-500">{item.notas}</div>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
