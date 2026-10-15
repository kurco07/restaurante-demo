import { lazy, Suspense } from 'react'
import type { PlatoAutopedido } from '../../../../models/types'
import { fondoPlato } from './fondoPlato'

// Carga diferida: @google/model-viewer trae su propio motor 3D (pesa
// bastante) y la mayoría de los platos todavía no tienen modelo — que
// no infle el bundle inicial de todos los clientes que nunca ven RA.
const VisorAR = lazy(() => import('../../../components/ui/VisorAR').then((m) => ({ default: m.VisorAR })))

interface HojaPersonalizacionProps {
  plato: PlatoAutopedido
  cantidad: number
  onCambiarCantidad: (delta: number) => void
  nota: string
  onCambiarNota: (nota: string) => void
  precio: number
  onAgregar: () => void
  onCerrar: () => void
}

// Hoja inferior para agregar un plato: cantidad + nota libre, igual que el
// mesonero. Proteína/quitar/extras quedan diferidos hasta que exista la
// tabla de personalización (ver nota de Fase 2, Módulo 3 en el roadmap).
export function HojaPersonalizacion(props: HojaPersonalizacionProps) {
  const { plato } = props

  return (
    <div className="fixed inset-0 z-20 bg-[#2b2118]/40" onClick={props.onCerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-0 left-1/2 flex max-h-[88vh] w-full max-w-[430px] -translate-x-1/2 flex-col rounded-t-3xl bg-white"
      >
        <div className="overflow-y-auto">
          <div
            className="flex h-[130px] items-center justify-center rounded-t-3xl"
            style={{ background: fondoPlato(plato.imagen_url) }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.4} className="h-10 w-10">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </div>

          <div className="px-5 py-[18px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold text-gray-900">{plato.nombre}</p>
                {plato.descripcion && <p className="mt-1 text-xs text-gray-500">{plato.descripcion}</p>}
              </div>
              <button type="button" onClick={props.onCerrar} className="text-lg text-gray-500" aria-label="Cerrar">
                ✕
              </button>
            </div>

            {plato.modelo_ar_glb_url && (
              <div className="mt-3.5">
                <Suspense fallback={<div className="h-[220px] animate-pulse rounded-xl bg-gray-100" />}>
                  <VisorAR glbUrl={plato.modelo_ar_glb_url} usdzUrl={plato.modelo_ar_usdz_url} nombre={plato.nombre} />
                </Suspense>
              </div>
            )}

            <div className="mt-[22px] flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-[0.05em] text-gray-900">Cantidad</span>
              <div className="flex items-center gap-3.5">
                <BotonCantidad onClick={() => props.onCambiarCantidad(-1)}>−</BotonCantidad>
                <span className="min-w-4 text-center text-base font-extrabold">{props.cantidad}</span>
                <BotonCantidad onClick={() => props.onCambiarCantidad(1)}>+</BotonCantidad>
              </div>
            </div>

            <textarea
              value={props.nota}
              onChange={(e) => props.onCambiarNota(e.target.value)}
              rows={2}
              placeholder="Nota para este plato (opcional)..."
              className="mt-4 w-full resize-none rounded-[10px] border border-orange-100 px-3 py-2.5 text-[12.5px] outline-none focus:border-orange-400"
            />
          </div>
        </div>

        <div className="border-t border-orange-100 px-5 py-3.5">
          <button
            type="button"
            onClick={props.onAgregar}
            className="w-full rounded-xl bg-orange-500 p-3.5 text-center text-sm font-extrabold text-white"
          >
            Agregar al pedido — ${props.precio.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}

function BotonCantidad({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-orange-100 bg-orange-50 text-base font-bold text-orange-600"
    >
      {children}
    </button>
  )
}
