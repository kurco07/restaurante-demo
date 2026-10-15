import { useRecetaCosteada } from '../../../../controllers/gerencia/useRecetaCosteada'
import type { RentabilidadPlato } from '../../../../models/types'
import { formatearMoneda } from '../../../components/ui/constants'
import { ModalAdmin } from '../../administracion/components/comunes/ModalAdmin'

interface FichaRecetaModalProps {
  plato: RentabilidadPlato
  onCerrar: () => void
}

function cantidad(valor: number, unidad: string) {
  return `${valor.toLocaleString('es', { maximumFractionDigits: 3 })} ${unidad}`
}

// Ficha de solo lectura: de qué está hecho el plato y cuánto cuesta cada
// insumo, para entender su rentabilidad. Editar la receta es tarea de
// administración, gerencia no entra ahí.
export function FichaRecetaModal({ plato, onCerrar }: FichaRecetaModalProps) {
  const r = useRecetaCosteada(plato.menu_item_id)
  const precio = Number(plato.precio_promedio)

  return (
    <ModalAdmin titulo={`Receta · ${plato.plato}`} onCerrar={onCerrar}>
      {r.cargando && <p className="py-8 text-center text-sm text-[var(--ink-soft)]">Cargando receta…</p>}

      {r.error && (
        <p className="rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--red)]">
          No se pudo cargar la receta: {r.error}
        </p>
      )}

      {!r.cargando && !r.error && r.ingredientes.length === 0 && (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-3 text-[12.5px] text-[var(--ink-soft)]">
          Este plato no tiene receta cargada. La carga administración.
        </p>
      )}

      {!r.cargando && !r.error && r.ingredientes.length > 0 && (
        <>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                <th className="py-2 pr-3">Insumo</th>
                <th className="py-2 pr-3 text-right">Cantidad</th>
                <th className="py-2 pr-3 text-right" title="Última compra recibida, por unidad">
                  Costo
                </th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {r.ingredientes.map((i) => (
                <tr key={i.insumo_id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2.5 pr-3 font-semibold">{i.insumo}</td>
                  <td className="py-2.5 pr-3 text-right">{cantidad(i.cantidad, i.unidad)}</td>
                  <td className="py-2.5 pr-3 text-right">
                    {i.costo_unitario == null ? (
                      <span className="text-[11px] font-bold text-[var(--orange-dark)]">Sin compra</span>
                    ) : (
                      formatearMoneda(i.costo_unitario)
                    )}
                  </td>
                  <td className="py-2.5 text-right">{i.subtotal == null ? '—' : formatearMoneda(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex flex-col gap-1.5 rounded-xl bg-[var(--surface-alt)] px-4 py-3 text-[12.5px]">
            <Fila etiqueta="Costo del plato" valor={`${r.completo ? '' : '≥ '}${formatearMoneda(r.costoTotal)}`} />
            <Fila etiqueta="Precio cobrado (promedio)" valor={formatearMoneda(precio)} />
            {r.completo && (
              <Fila
                etiqueta="Margen por plato"
                valor={`${formatearMoneda(precio - r.costoTotal)}${
                  precio > 0 ? ` · ${(((precio - r.costoTotal) / precio) * 100).toFixed(1)}%` : ''
                }`}
                negativo={precio - r.costoTotal < 0}
              />
            )}
          </div>

          {!r.completo && (
            <p className="mt-3 text-[11.5px] text-[var(--orange-dark)]">
              Hay insumos sin compra recibida: el costo real es mayor y el margen no se puede calcular todavía.
            </p>
          )}

          <p className="mt-3 text-[11.5px] text-[var(--ink-soft)]">
            Solo lectura. Si la receta está mal, la corrige administración.
          </p>
        </>
      )}
    </ModalAdmin>
  )
}

function Fila({ etiqueta, valor, negativo }: { etiqueta: string; valor: string; negativo?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[var(--ink-soft)]">{etiqueta}</span>
      <span className={`font-bold ${negativo ? 'text-[var(--red)]' : ''}`}>{valor}</span>
    </div>
  )
}
