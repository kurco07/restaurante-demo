import { useState } from 'react'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { usePowerSyncWatch } from '../../../controllers/usePowerSyncWatch'
import { RecetaModal } from './components/RecetaModal'

interface CategoriaRow {
  id: string
  nombre: string
}

interface PlatoRow {
  id: string
  nombre: string
  categoria_id: string
  // Líneas de receta cargadas: 0 = sin receta todavía
  ingredientes: number
}

const SQL_PLATOS = `
  select mi.id, mi.nombre, mi.categoria_id,
         (select count(*) from recetas r where r.menu_item_id = mi.id) as ingredientes
    from menu_items mi
   where mi.tenant_id = ?
   order by mi.nombre
`

// Recetario de cocina: buscar cualquier plato y ver su receta, sin tener
// que esperar a que llegue un pedido. Solo lectura y sin precios (cocina no
// ve precios, arquitectura.md §4.10). Lectura local: funciona offline.
export default function RecetasCocinaPage() {
  const { usuario } = useUsuario()
  const categorias = usePowerSyncWatch<CategoriaRow>(
    'select id, nombre from categorias_menu where tenant_id = ? order by orden',
    [usuario?.tenant_id ?? ''],
  )
  const platos = usePowerSyncWatch<PlatoRow>(SQL_PLATOS, [usuario?.tenant_id ?? ''])
  const [categoria, setCategoria] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState<PlatoRow | null>(null)

  const q = busqueda.trim().toLowerCase()
  const visibles = platos.filter(
    (p) => (!categoria || p.categoria_id === categoria) && (!q || p.nombre.toLowerCase().includes(q)),
  )

  return (
    <div className="mx-auto max-w-305">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Recetas</h1>
          <p className="text-sm text-gray-500">Toca un plato para ver sus ingredientes</p>
        </div>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar plato…"
          className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm sm:w-64"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {[{ id: null, nombre: 'Todas' } as { id: string | null; nombre: string }, ...categorias].map((c) => (
          <button
            key={c.id ?? 'todas'}
            type="button"
            onClick={() => setCategoria(c.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
              categoria === c.id ? 'border-[var(--orange)] bg-[var(--orange)] text-white' : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
          No hay platos que coincidan.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setAbierto(p)}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="block text-sm font-extrabold text-gray-900">{p.nombre}</span>
              <span className={`mt-1 block text-[11px] font-semibold ${p.ingredientes ? 'text-gray-500' : 'text-amber-700'}`}>
                {p.ingredientes
                  ? `${p.ingredientes} ingrediente${p.ingredientes === 1 ? '' : 's'}`
                  : 'Sin receta cargada'}
              </span>
            </button>
          ))}
        </div>
      )}

      {abierto && <RecetaModal menuItemId={abierto.id} plato={abierto.nombre} onCerrar={() => setAbierto(null)} />}
    </div>
  )
}
