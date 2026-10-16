import { Link } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useCarritos } from '../../../controllers/pedido/useCarritos'
import { SIN_MESA } from '../../../controllers/pedido/carritoContext'
import { useMesasSede } from '../../../controllers/mesonero/useMesasSede'
import {
  useMisPedidos,
  type EstadoItemMesonero,
  type ItemMisPedidos,
} from '../../../controllers/mesonero/useMisPedidos'
import type { Usuario } from '../../../models/types'

const ESTADOS: Record<EstadoItemMesonero, { etiqueta: string; clase: string; orden: number }> = {
  listo: { etiqueta: 'Listo para llevar', clase: 'bg-green-100 text-green-800', orden: 0 },
  en_preparacion: { etiqueta: 'En preparación', clase: 'bg-amber-100 text-amber-800', orden: 1 },
  pendiente: { etiqueta: 'En cocina', clase: 'bg-[var(--surface-alt)] text-[var(--orange-dark)]', orden: 2 },
  por_aprobar: { etiqueta: 'Por aprobar (QR)', clase: 'bg-sky-100 text-sky-800', orden: 3 },
  entregado: { etiqueta: 'Entregado', clase: 'bg-gray-100 text-gray-500', orden: 4 },
  anulado: { etiqueta: 'Anulado', clase: 'bg-red-50 text-red-600', orden: 5 },
}

interface GrupoMesa {
  mesaId: string
  mesa: string
  items: ItemMisPedidos[]
  sinEnviar: number
}

function platos(n: number) {
  return `${n} plato${n === 1 ? '' : 's'}`
}

// Mis pedidos: qué envié a cocina en mis mesas abiertas y en qué va cada
// plato, con lo "listo para llevar" primero. Solo lectura: cobrar y cerrar
// se hace desde el mapa de mesas.
export default function MisPedidosPage() {
  const { usuario } = useUsuario()
  if (!usuario) return null
  return <MisPedidos usuario={usuario} />
}

function MisPedidos({ usuario }: { usuario: Usuario }) {
  const { items } = useMisPedidos(usuario)
  const { borradores } = useCarritos()
  const mesas = useMesasSede(usuario)

  const grupos = new Map<string, GrupoMesa>()
  for (const item of items) {
    const grupo = grupos.get(item.mesa_id) ?? { mesaId: item.mesa_id, mesa: item.mesa, items: [], sinEnviar: 0 }
    grupo.items.push(item)
    grupos.set(item.mesa_id, grupo)
  }
  // Mesas con platos anotados que todavía no se enviaron a cocina
  for (const [clave, borrador] of Object.entries(borradores)) {
    if (clave === SIN_MESA) continue
    const mesa = mesas.find((m) => m.id === clave)
    if (!mesa) continue
    const grupo = grupos.get(clave) ?? { mesaId: clave, mesa: mesa.numero, items: [], sinEnviar: 0 }
    grupo.sinEnviar = borrador.reduce((s, i) => s + i.cantidad, 0)
    grupos.set(clave, grupo)
  }

  const conListos = (g: GrupoMesa) => g.items.some((i) => i.estado === 'listo')
  const ordenados = [...grupos.values()].sort(
    (a, b) => Number(conListos(b)) - Number(conListos(a)) || a.mesa.localeCompare(b.mesa, 'es', { numeric: true }),
  )
  const sinMesa = (borradores[SIN_MESA] ?? []).reduce((s, i) => s + i.cantidad, 0)

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="text-2xl font-extrabold text-[var(--ink)]">Mis pedidos</h1>
      <p className="mb-5 text-sm text-[var(--ink-soft)]">Lo que enviaste a cocina en tus mesas abiertas</p>

      {sinMesa > 0 && (
        <Link
          to="/mesoneros/menu"
          className="mb-4 flex items-center justify-between rounded-2xl border border-dashed border-[var(--orange)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--orange-dark)]"
        >
          <span>Tienes {platos(sinMesa)} anotados sin mesa</span>
          <span>Elegir mesa →</span>
        </Link>
      )}

      {ordenados.length === 0 && sinMesa === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-12 text-center text-sm text-[var(--ink-soft)]">
          No tienes pedidos en curso.{' '}
          <Link to="/mesoneros/menu" className="font-bold text-[var(--orange-dark)]">
            Tomar un pedido →
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {ordenados.map((g) => (
          <section key={g.mesaId} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-[var(--orange)] px-2 text-base font-extrabold text-white">
                  {g.mesa}
                </div>
                <div>
                  <p className="font-extrabold text-[var(--ink)]">Mesa {g.mesa}</p>
                  {g.sinEnviar > 0 && (
                    <p className="text-xs font-bold text-amber-700">{platos(g.sinEnviar)} sin enviar</p>
                  )}
                </div>
              </div>
              <Link
                to={`/mesoneros/menu/${g.mesaId}`}
                className="whitespace-nowrap text-sm font-bold text-[var(--orange-dark)]"
              >
                Ver pedido →
              </Link>
            </div>

            {g.items.length > 0 && (
              <ul className="divide-y divide-[var(--border)]">
                {[...g.items]
                  .sort((a, b) => ESTADOS[a.estado].orden - ESTADOS[b.estado].orden)
                  .map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between gap-3 py-2 text-sm ${
                        item.estado === 'entregado' || item.estado === 'anulado' ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`font-semibold text-[var(--ink)] ${item.estado === 'anulado' ? 'line-through' : ''}`}
                        >
                          {item.cantidad}× {item.plato ?? 'Plato'}
                        </span>
                        {item.notas && <p className="text-xs italic text-[var(--ink-soft)]">{item.notas}</p>}
                      </div>
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${ESTADOS[item.estado].clase}`}
                      >
                        {ESTADOS[item.estado].etiqueta}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
