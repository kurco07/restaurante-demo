import { useState } from 'react'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { EstadoChip } from './components/panel/EstadoChip'
import { formatearMoneda } from '../../components/ui/constants'
import { usePedidosAdmin } from '../../../controllers/administracion/usePedidosAdmin'
import type { EstadoPedidoAdmin, PedidoAdmin } from '../../../models/types'

const chipPorEstado: Record<EstadoPedidoAdmin, { tono: 'verde' | 'naranja' | 'rojo'; label: string }> = {
  cocina: { tono: 'naranja', label: 'En cocina' },
  listo: { tono: 'verde', label: 'Listo para servir' },
  entregado: { tono: 'verde', label: 'Entregado' },
  cancelado: { tono: 'rojo', label: 'Cancelado' },
}

export default function PedidosAdminPage() {
  const { usuario, loading, error } = useUsuario()
  const p = usePedidosAdmin()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />
  if (p.cargando) return <LoadingSpinner message="Cargando pedidos…" />
  if (p.error) return <ErrorMessage message={p.error} />

  return (
    <AdminLayout usuario={usuario}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--acento)]">Administración</div>
          <h1 className="mt-1 text-[27px] font-extrabold">Pedidos</h1>
        </div>
        <input
          type="text"
          placeholder="Buscar por mesa o mesero..."
          value={p.busqueda}
          onChange={(e) => p.setBusqueda(e.target.value)}
          className="w-64 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px]"
        />
      </header>

      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{p.totalPedidosHoy}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Pedidos de hoy</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{formatearMoneda(p.totales.ticketPromedio)}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Ticket promedio</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold text-[var(--red)]">{p.totales.demorados}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Pedidos demorados</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {p.filtros.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => p.setFiltro(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
              p.filtro === f.key
                ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Mesero</th>
                  <th className="px-4 py-3">Ítems</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Hora</th>
                </tr>
              </thead>
              <tbody>
                {p.pedidos.map((pedido) => (
                  <tr
                    key={pedido.id}
                    onClick={() => p.setSeleccionadoId(pedido.id)}
                    className={`cursor-pointer border-b border-[var(--border)] last:border-none hover:bg-[var(--surface-alt)] ${
                      p.seleccionado?.id === pedido.id ? 'bg-[var(--surface-alt)]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-bold">Mesa {pedido.mesaNumero}</td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">{pedido.mesonero}</td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">
                      {pedido.items.reduce((acc, i) => acc + i.cantidad, 0)} ítems
                    </td>
                    <td className="px-4 py-3 font-bold">{formatearMoneda(pedido.total)}</td>
                    <td className="px-4 py-3">
                      <EstadoChip tono={chipPorEstado[pedido.estado].tono}>{chipPorEstado[pedido.estado].label}</EstadoChip>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">{pedido.horaLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-xs text-[var(--ink-soft)]">
            Mostrando {p.pedidos.length} de {p.totalPedidosHoy} pedidos de hoy
          </p>
        </div>

        <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {p.seleccionado ? (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-base font-extrabold">Mesa {p.seleccionado.mesaNumero}</p>
                  <p className="text-[11.5px] text-[var(--ink-soft)]">
                    {p.seleccionado.mesonero} · {p.seleccionado.horaLabel}
                  </p>
                </div>
                <EstadoChip tono={chipPorEstado[p.seleccionado.estado].tono}>
                  {chipPorEstado[p.seleccionado.estado].label}
                </EstadoChip>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {p.seleccionado.items.map((item) => (
                  <div key={item.nombre} className="flex items-center justify-between py-2.5 text-[13px]">
                    <span>
                      <span className="mr-1.5 font-extrabold text-[var(--orange-dark)]">{item.cantidad}×</span>
                      {item.nombre}
                    </span>
                    <span className="font-semibold text-[var(--ink-soft)]">
                      {formatearMoneda(item.cantidad * item.precioUnitario)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-sm font-bold">Total del pedido</span>
                <span className="text-lg font-extrabold text-[var(--orange-dark)]">
                  {formatearMoneda(p.seleccionado.total)}
                </span>
              </div>

              {p.seleccionado.estado !== 'cancelado' && p.seleccionado.estado !== 'entregado' && (
                <CancelarPedido
                  pedido={p.seleccionado}
                  cancelando={p.cancelando}
                  onCancelar={(motivo) => p.cancelarPedido(p.seleccionado!.id, motivo)}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">Selecciona un pedido para ver su detalle.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

// Anula todos los platos activos del pedido (misma función que ya usa
// supervisor — migración 0015 impide anular lo ya entregado, por eso el
// botón no aparece para pedidos entregados/cancelados).
function CancelarPedido({
  pedido,
  cancelando,
  onCancelar,
}: {
  pedido: PedidoAdmin
  cancelando: boolean
  onCancelar: (motivo: string) => Promise<void>
}) {
  const [motivo, setMotivo] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="mt-4 w-full rounded-lg bg-[var(--red)] py-2.5 text-[13px] font-bold text-white"
      >
        Cancelar pedido
      </button>
    )
  }

  return (
    <div className="mt-4">
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={2}
        placeholder="Motivo de la cancelación…"
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[13px]"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="flex-1 rounded-lg border border-[var(--border)] py-2 text-[13px] font-bold text-[var(--ink-soft)]"
        >
          Volver
        </button>
        <button
          type="button"
          disabled={!motivo.trim() || cancelando}
          onClick={() => onCancelar(motivo.trim())}
          className="flex-1 rounded-lg bg-[var(--red)] py-2 text-[13px] font-bold text-white disabled:opacity-50"
        >
          {cancelando ? 'Cancelando…' : `Confirmar (${pedido.items.length} platos)`}
        </button>
      </div>
    </div>
  )
}
