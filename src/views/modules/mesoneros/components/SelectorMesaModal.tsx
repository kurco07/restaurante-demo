import { aceptaPedido, type MesaVista } from '../../../../controllers/mesonero/useMesasSede'

interface SelectorMesaModalProps {
  titulo: string
  mesas: MesaVista[]
  // Mesa en la que ya está el borrador: se marca y no se puede volver a elegir
  mesaActualId?: string
  onElegir: (mesa: MesaVista) => void
  onCerrar: () => void
}

const GRUPOS: { estado: MesaVista['estado']; titulo: string; detalle: string }[] = [
  { estado: 'mia', titulo: 'Tus mesas', detalle: 'Se suma al pedido abierto' },
  { estado: 'libre', titulo: 'Libres', detalle: 'Se abre al enviar' },
  { estado: 'sin_atender', titulo: 'Pedidas por QR sin atender', detalle: 'Pasa a ser tuya al enviar' },
]

// Elegir a qué mesa va un pedido (o a cuál se mueve el borrador). Solo
// mesas que aceptan pedido: las de otro mesonero y las por limpiar no
// aparecen, igual que en el mapa.
export function SelectorMesaModal({ titulo, mesas, mesaActualId, onElegir, onCerrar }: SelectorMesaModalProps) {
  const disponibles = mesas
    .filter(aceptaPedido)
    .sort((a, b) => a.numero.localeCompare(b.numero, 'es', { numeric: true }))

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2b2118]/35 p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-[var(--surface)] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-extrabold text-[var(--ink)]">{titulo}</p>
          <button
            type="button"
            onClick={onCerrar}
            className="text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {disponibles.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--ink-soft)]">
            No hay mesas disponibles: todas son de otro mesonero o están por limpiar.
          </p>
        )}

        {GRUPOS.map((grupo) => {
          const delGrupo = disponibles.filter((m) => m.estado === grupo.estado)
          if (delGrupo.length === 0) return null
          return (
            <section key={grupo.estado} className="mb-4 last:mb-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--ink-soft)]">{grupo.titulo}</p>
              <p className="mb-2 text-[11px] text-[var(--ink-soft)]">{grupo.detalle}</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {delGrupo.map((mesa) => {
                  const actual = mesa.id === mesaActualId
                  return (
                    <button
                      key={mesa.id}
                      type="button"
                      disabled={actual}
                      onClick={() => onElegir(mesa)}
                      className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-lg font-extrabold ${
                        actual
                          ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                          : grupo.estado === 'sin_atender'
                            ? 'border-sky-300 bg-sky-50 text-sky-800 hover:border-sky-500'
                            : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--ink)] hover:border-[var(--orange)]'
                      }`}
                    >
                      {mesa.numero}
                      {actual && <span className="text-[9px] font-bold">actual</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
