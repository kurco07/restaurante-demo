import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { useMesasAdmin } from '../../../controllers/administracion/useMesasAdmin'
import type { Mesa } from '../../../models/types'

const claseSegunEstado: Record<Mesa['estado'], string> = {
  libre: 'border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]',
  ocupada: 'border-[var(--orange)] bg-[var(--orange-bg)] text-[var(--orange-dark)]',
  por_limpiar: 'border-[var(--border)] bg-[var(--gray-bg)] text-[var(--ink-soft)]',
}

const etiquetaEstado: Record<Mesa['estado'], string> = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  por_limpiar: 'Por limpiar',
}

export default function MesasAdminPage() {
  const { usuario, loading: loadingUsuario, error: errorUsuario } = useUsuario()
  const m = useMesasAdmin()
  const canvasRef = useRef<HTMLDivElement>(null)
  const movidoRef = useRef(false)

  const [colocando, setColocando] = useState(false)
  const [arrastrandoId, setArrastrandoId] = useState<string | null>(null)
  const [posicionArrastre, setPosicionArrastre] = useState<{ x: number; y: number } | null>(null)

  if (loadingUsuario) return <LoadingSpinner message="Cargando tu perfil…" />
  if (errorUsuario) return <ErrorMessage message={errorUsuario} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  function posicionDesdeEvento(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 50, y: 50 }
    const x = Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
    const y = Math.round(Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)))
    return { x, y }
  }

  function handleClickCanvas(e: React.MouseEvent<HTMLDivElement>) {
    if (!colocando || e.target !== e.currentTarget) return
    const pos = posicionDesdeEvento(e.clientX, e.clientY)
    m.agregarMesa(pos.x, pos.y)
    setColocando(false)
  }

  function handlePointerDownMesa(e: React.PointerEvent<HTMLButtonElement>, mesa: Mesa) {
    e.stopPropagation()
    movidoRef.current = false
    setArrastrandoId(mesa.id)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMoveMesa(e: React.PointerEvent<HTMLButtonElement>, mesaId: string) {
    if (arrastrandoId !== mesaId) return
    movidoRef.current = true
    setPosicionArrastre(posicionDesdeEvento(e.clientX, e.clientY))
  }

  function handlePointerUpMesa(mesa: Mesa) {
    if (arrastrandoId !== mesa.id) return
    const pos = posicionArrastre
    setArrastrandoId(null)
    setPosicionArrastre(null)
    if (movidoRef.current && pos) {
      m.moverMesa(mesa.id, pos.x, pos.y)
    } else {
      m.setSeleccionadaId(mesa.id)
    }
  }

  return (
    <AdminLayout usuario={usuario}>
      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--acento)]">Administración</div>
        <h1 className="mt-1 text-[27px] font-extrabold">Mesas</h1>
        <p className="mt-1 text-[12.5px] text-[var(--ink-soft)]">
          Este es el mismo mapa que ve el mesonero — aquí lo configuras, ellos solo lo ven. Arrastra una mesa para
          moverla.
        </p>
      </header>

      {m.error && <ErrorMessage message={m.error} />}

      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{m.totales.total}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Mesas totales</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{m.totales.ocupadas}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Ocupadas ahora</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold text-[var(--red)]">{m.totales.porLimpiar}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Por limpiar</div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
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
              {f.label} · {m.contador(f.key)}
            </button>
          ))}
        </div>

        {colocando ? (
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--orange-dark)]">
            Haz clic en el plano para colocar la nueva mesa
            <button
              type="button"
              onClick={() => setColocando(false)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[var(--ink-soft)]"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* Hoja con el QR de cada mesa, para imprimir (Fase 8, Módulo 4) */}
            <Link
              to="/administracion/mesas/qr"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink)]"
            >
              Imprimir QR de las mesas
            </Link>
            <button
              type="button"
              onClick={() => setColocando(true)}
              disabled={m.guardando}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink)] disabled:opacity-50"
            >
              + Agregar mesa
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-3.5 text-[11px] text-[var(--ink-soft)]">
        <Leyenda color="border-[var(--orange)] bg-[var(--orange-bg)]" label="Ocupada" />
        <Leyenda color="border-dashed border-[var(--border)] bg-[var(--surface)]" label="Libre" />
        <Leyenda color="border-[var(--border)] bg-[var(--gray-bg)]" label="Por limpiar" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.65fr_1fr]">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
          {m.loading ? (
            <LoadingSpinner message="Cargando mesas…" />
          ) : (
            <div
              ref={canvasRef}
              onClick={handleClickCanvas}
              className={`relative h-[460px] w-full overflow-hidden rounded-xl border-2 border-[var(--border)] bg-[var(--gray-bg)] ${
                colocando ? 'cursor-crosshair' : ''
              }`}
            >
              <div className="pointer-events-none absolute right-0 top-0 flex h-[30%] w-[22%] items-center justify-center border-2 border-[var(--border)] bg-[var(--surface-alt)] text-[11px] font-extrabold uppercase tracking-wide text-[var(--ink-soft)]">
                Cocina
              </div>
              <div className="pointer-events-none absolute right-0 top-[30%] flex h-[14%] w-[14%] items-center justify-center border-2 border-[var(--border)] bg-[var(--surface-alt)] text-[9px] font-extrabold uppercase text-[var(--ink-soft)]">
                Baños
              </div>

              {m.mesas.map((mesa) => {
                const arrastrandoEsta = arrastrandoId === mesa.id && posicionArrastre
                const left = arrastrandoEsta ? posicionArrastre.x : mesa.posicion_x ?? 50
                const top = arrastrandoEsta ? posicionArrastre.y : mesa.posicion_y ?? 50
                return (
                  <button
                    key={mesa.id}
                    type="button"
                    onPointerDown={(e) => handlePointerDownMesa(e, mesa)}
                    onPointerMove={(e) => handlePointerMoveMesa(e, mesa.id)}
                    onPointerUp={() => handlePointerUpMesa(mesa)}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      opacity: m.coincideFiltro(mesa) ? 1 : 0.25,
                      pointerEvents: m.coincideFiltro(mesa) ? 'auto' : 'none',
                      touchAction: 'none',
                    }}
                    className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center justify-center rounded-xl border-2 text-center shadow-sm transition-shadow active:cursor-grabbing hover:shadow-md ${
                      claseSegunEstado[mesa.estado]
                    } ${m.seleccionadaId === mesa.id ? 'ring-2 ring-[var(--orange)] ring-offset-1' : ''}`}
                  >
                    <span className="text-sm font-extrabold leading-none">{mesa.nombre_numero}</span>
                    <span className="mt-0.5 text-[8px] font-bold leading-none">{etiquetaEstado[mesa.estado]}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {m.mesaSeleccionada ? (
            <EditorMesa
              key={m.mesaSeleccionada.id}
              mesa={m.mesaSeleccionada}
              guardando={m.guardando}
              onGuardar={m.guardarMesa}
              onEliminar={m.borrarMesa}
            />
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">Toca una mesa del plano para editarla, o arrástrala para moverla.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

interface EditorMesaProps {
  mesa: Mesa
  guardando: boolean
  onGuardar: (
    id: string,
    cambios: { nombre_numero: string; posicion_x: number | null; posicion_y: number | null },
  ) => void
  onEliminar: (id: string) => void
}

function EditorMesa({ mesa, guardando, onGuardar, onEliminar }: EditorMesaProps) {
  const [nombreNumero, setNombreNumero] = useState(mesa.nombre_numero)

  return (
    <>
      <p className="mb-4 text-base font-extrabold">Editor de mesa</p>
      <div className="flex flex-col gap-3 text-[13px]">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Número / nombre</span>
          <input
            value={nombreNumero}
            onChange={(e) => setNombreNumero(e.target.value)}
            className="rounded-lg bg-[var(--surface-alt)] px-3 py-2 font-semibold outline-none"
          />
        </label>

        <p className="text-[11.5px] text-[var(--ink-soft)]">
          La posición se ajusta arrastrando la mesa directamente en el plano.
        </p>

        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Estado</p>
          <p className="rounded-lg bg-[var(--surface-alt)] px-3 py-2 font-semibold">{etiquetaEstado[mesa.estado]}</p>
          <p className="mt-1 text-[11.5px] text-[var(--ink-soft)]">
            El estado lo cambian el mesonero y el cierre de cuenta — no se edita aquí.
          </p>
        </div>

        <EnlaceAutopedido mesaId={mesa.id} />

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={guardando}
            onClick={() =>
              onGuardar(mesa.id, {
                nombre_numero: nombreNumero,
                posicion_x: mesa.posicion_x,
                posicion_y: mesa.posicion_y,
              })
            }
            className="flex-1 rounded-lg bg-[var(--orange)] py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={() => {
              if (confirm(`¿Eliminar la mesa ${mesa.nombre_numero}? Esto borra también su historial de sesiones.`)) {
                onEliminar(mesa.id)
              }
            }}
            className="rounded-lg px-3 text-[13px] font-bold text-[var(--red)] disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>
    </>
  )
}

// Enlace público del autopedido de esta mesa (Fase 3, Módulo 1). Es el que
// va impreso en el QR de la mesa; lleva el id de la mesa tal cual.
function EnlaceAutopedido({ mesaId }: { mesaId: string }) {
  const [copiado, setCopiado] = useState(false)
  const url = `${window.location.origin}/autopedido/${mesaId}`

  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Enlace del QR</p>
      <p className="break-all rounded-lg bg-[var(--surface-alt)] px-3 py-2 text-[11.5px]">{url}</p>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-bold text-[var(--orange-dark)]">
        <button
          type="button"
          onClick={() =>
            navigator.clipboard.writeText(url).then(
              () => setCopiado(true),
              () => setCopiado(false),
            )
          }
        >
          {copiado ? 'Copiado ✓' : 'Copiar enlace'}
        </button>
        <a href={url} target="_blank" rel="noreferrer">
          Abrir vista del cliente
        </a>
        {/* La misma hoja de QR, solo con esta mesa: para reponer un QR roto o perdido */}
        <Link to={`/administracion/mesas/qr?mesa=${mesaId}`}>Ver QR de esta mesa</Link>
      </div>
    </div>
  )
}

function Leyenda({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm border ${color}`} />
      {label}
    </span>
  )
}
