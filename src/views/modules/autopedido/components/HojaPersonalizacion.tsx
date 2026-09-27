import type { ReactNode } from 'react'
import type { PlatoAutopedido } from '../../../../models/types'

interface HojaPersonalizacionProps {
  plato: PlatoAutopedido
  proteina: string | null
  onElegirProteina: (proteina: string) => void
  quitados: Set<string>
  onAlternarQuitado: (ingrediente: string) => void
  extras: Set<string>
  onAlternarExtra: (extra: string) => void
  cantidad: number
  onCambiarCantidad: (delta: number) => void
  nota: string
  onCambiarNota: (nota: string) => void
  precio: number
  onAgregar: () => void
  onCerrar: () => void
}

// Hoja inferior para personalizar un plato antes de agregarlo al pedido.
export function HojaPersonalizacion(props: HojaPersonalizacionProps) {
  const { plato } = props

  return (
    <div className="fixed inset-0 z-20 bg-[#2b2118]/40" onClick={props.onCerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-0 left-1/2 flex max-h-[88vh] w-full max-w-[430px] -translate-x-1/2 flex-col rounded-t-3xl bg-white"
      >
        <div className="overflow-y-auto">
          <div className={`flex h-[130px] items-center justify-center rounded-t-3xl bg-gradient-to-br ${plato.gradiente}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.4} className="h-10 w-10">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </div>

          <div className="px-5 py-[18px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-extrabold text-gray-900">{plato.nombre}</p>
                <p className="mt-1 text-xs text-gray-500">{plato.descripcion}</p>
              </div>
              <button type="button" onClick={props.onCerrar} className="text-lg text-gray-500" aria-label="Cerrar">
                ✕
              </button>
            </div>

            {plato.proteinas && (
              <Grupo titulo="Elige tu proteína" obligatorio>
                {plato.proteinas.map((p) => (
                  <Chip key={p} estilo={props.proteina === p ? 'seleccionado' : 'incluido'} onClick={() => props.onElegirProteina(p)}>
                    {p}
                  </Chip>
                ))}
              </Grupo>
            )}

            {plato.quitables && (
              <Grupo titulo="Quitar ingredientes">
                {plato.quitables.map((ing) => {
                  const quitado = props.quitados.has(ing)
                  return (
                    <Chip key={ing} estilo={quitado ? 'quitado' : 'incluido'} onClick={() => props.onAlternarQuitado(ing)}>
                      {`${quitado ? '✕' : '✓'} ${ing}`}
                    </Chip>
                  )
                })}
              </Grupo>
            )}

            {plato.extras && (
              <Grupo titulo="Extras">
                {plato.extras.map((ex) => {
                  const activo = props.extras.has(ex.nombre)
                  return (
                    <Chip
                      key={ex.nombre}
                      estilo={activo ? 'extraActivo' : 'extraInactivo'}
                      onClick={() => props.onAlternarExtra(ex.nombre)}
                    >
                      {`${activo ? '✓' : '+'} ${ex.nombre} ($${ex.precio.toFixed(2)})`}
                    </Chip>
                  )
                })}
              </Grupo>
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

function Grupo({ titulo, obligatorio, children }: { titulo: string; obligatorio?: boolean; children: ReactNode }) {
  return (
    <>
      <div className="mb-1 mt-5 text-xs font-extrabold uppercase tracking-[0.05em] text-gray-900">
        {titulo}
        {obligatorio && <span className="text-[10.5px] normal-case tracking-normal text-red-500"> · obligatorio</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </>
  )
}

const estilosChip = {
  seleccionado: 'border-orange-500 bg-orange-500 text-white',
  incluido: 'border-orange-100 bg-orange-50 text-gray-900',
  quitado: 'border-red-400 bg-white text-red-500 line-through',
  extraActivo: 'border-orange-500 bg-orange-50 text-orange-600',
  extraInactivo: 'border-orange-100 bg-white text-gray-500',
}

function Chip({ estilo, onClick, children }: { estilo: keyof typeof estilosChip; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-[1.5px] px-[15px] py-[9px] text-[12.5px] font-bold ${estilosChip[estilo]}`}
    >
      {children}
    </button>
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
