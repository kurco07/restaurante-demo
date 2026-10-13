import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { InventarioTabs } from './components/InventarioTabs'
import { BotonNuevo, EncabezadoAdmin, ModalAdmin } from './components/comunes'
import { RegistrarAjustePanel } from './components/movimientos/RegistrarAjustePanel'
import { useMovimientos } from '../../../controllers/administracion/useMovimientos'
import type { TipoMovimiento } from '../../../models/types'

const clasePorTipo: Record<TipoMovimiento, { borde: string; chip: string; label: string }> = {
  entrada: { borde: 'border-l-[var(--green)]', chip: 'bg-[var(--green-bg)] text-[var(--green)]', label: 'Entrada' },
  salida: { borde: 'border-l-[var(--orange)]', chip: 'bg-[var(--orange-bg)] text-[var(--orange-dark)]', label: 'Salida' },
  merma: { borde: 'border-l-[var(--red)]', chip: 'bg-[var(--red-bg)] text-[var(--red)]', label: 'Merma' },
  ajuste: { borde: 'border-l-[var(--green)]', chip: 'bg-[var(--green-bg)] text-[var(--green)]', label: 'Ajuste' },
}

function formatearFecha(iso: string) {
  const fecha = new Date(iso)
  const hoy = new Date().toDateString() === fecha.toDateString()
  const hora = fecha.toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' })
  return hoy ? `hoy ${hora}` : fecha.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }) + ` ${hora}`
}

export default function MovimientosPage() {
  const { usuario, loading: loadingUsuario, error: errorUsuario } = useUsuario()
  const m = useMovimientos()

  if (loadingUsuario) return <LoadingSpinner message="Cargando tu perfil…" />
  if (errorUsuario) return <ErrorMessage message={errorUsuario} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoAdmin ruta="Administración · Inventario" titulo="Movimientos">
        <input
          type="text"
          placeholder="Buscar por insumo..."
          value={m.busqueda}
          onChange={(e) => m.setBusqueda(e.target.value)}
          className="w-56 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px]"
        />
        <BotonNuevo onClick={m.abrirNuevo}>+ Nuevo ajuste</BotonNuevo>
      </EncabezadoAdmin>

      <InventarioTabs />

      {m.error && <ErrorMessage message={m.error} />}

      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{m.totales.total}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Movimientos hoy</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{m.totales.salidasPorVenta}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Salidas por venta hoy</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold text-[var(--red)]">{m.totales.mermas}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Mermas registradas hoy</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {m.filtros.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => m.setFiltro(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
              m.filtro === f.key
                ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {m.loading ? (
        <LoadingSpinner message="Cargando movimientos…" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Insumo</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {m.movimientos.map((mov) => {
                const c = clasePorTipo[mov.tipo]
                const signo = mov.tipo === 'salida' || mov.tipo === 'merma' ? '-' : '+'
                const esManual = mov.tipo === 'merma' || mov.tipo === 'ajuste'
                return (
                  <tr key={mov.id} className={`border-b border-l-4 border-[var(--border)] last:border-b-0 ${c.borde}`}>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${c.chip}`}>
                        {c.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{mov.insumo}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--ink-soft)]">
                      {signo}
                      {mov.cantidad} {mov.unidad}
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">{mov.referencia ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">{mov.responsable}</td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">{formatearFecha(mov.fecha)}</td>
                    <td className="px-4 py-3 text-right">
                      {esManual && (
                        <button
                          type="button"
                          onClick={() => m.revertir(mov)}
                          className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-bold text-[var(--orange-dark)] hover:bg-[var(--surface-alt)]"
                        >
                          Revertir
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2.5 text-xs text-[var(--ink-soft)]">Mostrando {m.movimientos.length} movimientos</p>

      {m.modalAbierto && (
        <ModalAdmin titulo="Registrar ajuste manual" onCerrar={m.cerrarModal}>
          <p className="mb-4 text-[11.5px] text-[var(--ink-soft)]">Para mermas o correcciones de conteo</p>
          <RegistrarAjustePanel
            insumos={m.insumos}
            insumoId={m.insumoId}
            setInsumoId={m.setInsumoId}
            tipoAjuste={m.tipoAjuste}
            setTipoAjuste={m.setTipoAjuste}
            tiposAjuste={m.tiposAjuste}
            cantidad={m.cantidad}
            setCantidad={m.setCantidad}
            motivo={m.motivo}
            setMotivo={m.setMotivo}
            motivosAjuste={m.motivosAjuste}
            nota={m.nota}
            setNota={m.setNota}
            stockDisponible={m.stockDisponible}
            excedeStock={m.excedeStock}
            guardando={m.guardando}
            onRegistrar={m.registrar}
          />
        </ModalAdmin>
      )}
    </AdminLayout>
  )
}
