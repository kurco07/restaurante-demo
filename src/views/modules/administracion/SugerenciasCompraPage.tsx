import { Link } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { useSugerenciasCompra } from '../../../controllers/ia/useSugerenciasCompra'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { InventarioTabs } from './components/InventarioTabs'
import { BotonNuevo, EncabezadoAdmin } from './components/comunes'
import { RevisarSugerenciaCompra } from './components/compras/RevisarSugerenciaCompra'

// Sugerencias de compra de la IA (Fase 6, Módulos 2 y 5). Administración
// las genera a mano (7 días), las revisa y, al aprobar, se crean
// borradores de orden que siguen el paso normal de Compras. La IA nunca
// compra ni aprueba nada sola (CLAUDE.md).
export default function SugerenciasCompraPage() {
  const { usuario, loading, error } = useUsuario()
  const s = useSugerenciasCompra()

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    <AdminLayout usuario={usuario}>
      <EncabezadoAdmin ruta="Administración · Inventario · Sugerencias IA" titulo="Sugerencias de compra">
        <BotonNuevo onClick={s.generando ? undefined : s.generar}>
          {s.generando ? 'Generando… (puede tardar)' : '✦ Generar sugerencias (7 días)'}
        </BotonNuevo>
      </EncabezadoAdmin>

      <InventarioTabs />

      <p className="mb-5 text-xs text-[var(--ink-soft)]">
        La IA mira el consumo de los últimos 28 días, el stock, el mínimo y lo ya pedido, y propone qué comprar para la
        próxima semana. Nada se compra solo: al aprobar se crean borradores de orden en{' '}
        <Link to="/administracion/compras" className="font-bold text-[var(--orange-dark)]">
          Compras
        </Link>
        , que se revisan y aprueban como siempre.
      </p>

      {s.error && (
        <p className="mb-5 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--red)]">{s.error}</p>
      )}
      {s.aviso && (
        <p className="mb-5 rounded-xl bg-[var(--green-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--green)]">{s.aviso}</p>
      )}

      {s.cargando ? (
        <LoadingSpinner message="Cargando sugerencias…" />
      ) : (
        <>
          {s.pendientes.length === 0 && (
            <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center">
              <p className="text-[15px] font-extrabold">No hay sugerencias pendientes</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">Toca "Generar sugerencias" para que la IA revise el inventario.</p>
            </div>
          )}

          {s.pendientes.map((sug) => (
            <RevisarSugerenciaCompra
              key={sug.id}
              sugerencia={sug}
              proveedores={s.proveedores}
              guardando={s.guardando}
              onAprobar={(items) => s.aprobar(sug.id, items)}
              onRechazar={(motivo) => s.rechazar(sug.id, motivo)}
            />
          ))}

          {s.revisadas.length > 0 && (
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-[18px]">
              <p className="mb-3 text-[15px] font-extrabold">Historial</p>
              <ul className="flex flex-col gap-2 text-[12.5px]">
                {s.revisadas.map((sug) => (
                  <li key={sug.id} className="flex flex-wrap items-baseline gap-x-2 border-b border-[var(--border)] pb-2 last:border-0">
                    <span
                      className={`rounded-full px-2 py-px text-[10.5px] font-bold uppercase ${
                        sug.estado === 'aprobada'
                          ? 'bg-[var(--green-bg)] text-[var(--green)]'
                          : 'bg-[var(--gray-bg)] text-[var(--ink-soft)]'
                      }`}
                    >
                      {sug.estado}
                    </span>
                    <span className="font-bold">{new Date(sug.generada_en).toLocaleDateString('es')}</span>
                    <span className="text-[var(--ink-soft)]">
                      {sug.items.length} insumos sugeridos
                      {sug.estado === 'aprobada' && ` · ${sug.ordenesCreadas} borrador(es) creados`}
                      {sug.motivoRechazo && ` · motivo: ${sug.motivoRechazo}`}
                      {sug.revisada_por && ` · por ${sug.revisada_por}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </AdminLayout>
  )
}
