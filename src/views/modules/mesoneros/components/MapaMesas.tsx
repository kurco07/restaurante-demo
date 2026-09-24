import { useState } from 'react'
import { MesaCard, type EstadoMesaVista } from './MesaCard'
import { DetalleMesaPanel } from './DetalleMesaPanel'

export interface MesaMock {
  numero: number
  zona: string
  estado: EstadoMesaVista
  left: string
  top: string
  forma?: 'square' | 'round'
  tiempo?: string
  items?: number
  total?: number
  mesero?: string
  demorada?: boolean
  status?: 'cocina' | 'listo' | 'cuenta'
}

// Datos de ejemplo — esto se reemplaza por datos reales (Supabase/PowerSync)
// cuando se conecte el módulo de verdad. Por ahora es solo boceto visual.
const mesasEjemplo: MesaMock[] = [
  { numero: 1, zona: 'Salón principal', estado: 'libre', left: '16%', top: '8%' },
  { numero: 2, zona: 'Salón principal', estado: 'mia', left: '34%', top: '6%', tiempo: '12 min', items: 4, total: 24.5 },
  { numero: 3, zona: 'Salón principal', estado: 'mia', left: '52%', top: '11%', forma: 'round', tiempo: '4 min', items: 2, total: 14, status: 'listo' },
  { numero: 4, zona: 'Salón principal', estado: 'otro', left: '70%', top: '7%', mesero: 'Carlos', tiempo: '9 min' },

  { numero: 5, zona: 'Salón principal', estado: 'libre', left: '18%', top: '30%' },
  { numero: 6, zona: 'Salón principal', estado: 'limpiar', left: '38%', top: '32%' },
  { numero: 7, zona: 'Salón principal', estado: 'mia', left: '58%', top: '35%', forma: 'round', tiempo: '18 min', items: 3, total: 22, demorada: true },

  { numero: 8, zona: 'Terraza', estado: 'libre', left: '19%', top: '54%' },
  { numero: 9, zona: 'Terraza', estado: 'mia', left: '39%', top: '57%', forma: 'round', tiempo: '6 min', items: 1, total: 6, status: 'cuenta' },
  { numero: 10, zona: 'Terraza', estado: 'otro', left: '60%', top: '55%', mesero: 'Carlos', tiempo: '5 min' },

  { numero: 11, zona: 'Terraza', estado: 'libre', left: '17%', top: '78%' },
  { numero: 12, zona: 'Terraza', estado: 'mia', left: '43%', top: '80%', forma: 'round', tiempo: '2 min', items: 5, total: 31 },
]

const etiquetaSegunEstado = (mesa: MesaMock) => {
  if (mesa.estado === 'libre') return 'Libre'
  if (mesa.estado === 'limpiar') return 'Limpiar'
  if (mesa.estado === 'otro') return mesa.mesero ?? '—'
  if (mesa.status === 'cuenta') return 'Cuenta'
  return mesa.tiempo ?? ''
}

type Filtro = 'todas' | 'mias' | 'libres' | 'otro' | 'limpiar'

const filtros: { key: Filtro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'mias', label: 'Mías' },
  { key: 'libres', label: 'Libres' },
  { key: 'otro', label: 'Otro mesonero' },
  { key: 'limpiar', label: 'Por limpiar' },
]

function coincideFiltro(mesa: MesaMock, filtro: Filtro) {
  if (filtro === 'todas') return true
  if (filtro === 'mias') return mesa.estado === 'mia'
  if (filtro === 'libres') return mesa.estado === 'libre'
  if (filtro === 'otro') return mesa.estado === 'otro'
  return mesa.estado === 'limpiar'
}

export function MapaMesas() {
  const [seleccionada, setSeleccionada] = useState<number | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const contador = (f: Filtro) => mesasEjemplo.filter((m) => coincideFiltro(m, f)).length

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xl font-extrabold text-gray-900">{contador('mias')}</div>
          <div className="text-xs text-gray-500">Mesas asignadas</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xl font-extrabold text-gray-900">{contador('mias')}</div>
          <div className="text-xs text-gray-500">Ocupadas ahora</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xl font-extrabold text-red-500">{mesasEjemplo.filter((m) => m.demorada).length}</div>
          <div className="text-xs text-gray-500">Mesa demorada</div>
        </div>
      </div>

      <div className="grid grid-cols-[1.65fr_1fr] gap-5 items-start">
        <div>
          <p className="font-semibold text-gray-900">Mapa de mesas</p>
          <p className="mb-3 text-xs text-gray-500">Toca una mesa para ver o tomar su pedido</p>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {filtros.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFiltro(f.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                    filtro === f.key
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  {f.label} · {contador(f.key)}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-gray-400">
              🔒 El plano lo configura administración — aquí solo ves el estado
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-3.5 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-orange-400 bg-orange-50" /> Tuya
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-red-400 bg-red-50" /> Demorada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gray-100" /> Otro mesonero
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-gray-300 bg-white" /> Libre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-50" /> Por limpiar
            </span>
          </div>

          <div className="rounded-[18px] border border-gray-200 bg-white p-4">
            <div className="relative h-[460px] w-full overflow-hidden rounded-xl border-2 border-amber-200 bg-amber-50/60">
              <div className="absolute right-0 top-0 flex h-[34%] w-[26%] items-center justify-center border-2 border-amber-200 bg-orange-50 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">
                Cocina
              </div>
              <div className="absolute right-0 top-[34%] flex h-[16%] w-[16%] items-center justify-center border-2 border-amber-200 bg-orange-50 text-[9px] font-extrabold uppercase text-gray-400">
                Baños
              </div>
              <div className="absolute right-[2%] bottom-[4%] flex h-[16%] w-[26%] items-center justify-center gap-2 rounded-lg border-2 border-orange-400 bg-orange-50">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-gray-200 bg-white text-[9px] font-extrabold text-gray-400">B1</div>
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500 text-[9px] font-extrabold text-white">B2</div>
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-gray-200 bg-white text-[9px] font-extrabold text-gray-400">B3</div>
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-gray-200 bg-white text-[9px] font-extrabold text-gray-400">B4</div>
              </div>

              {mesasEjemplo.map((mesa) => (
                <MesaCard
                  key={mesa.numero}
                  numero={mesa.numero}
                  estado={mesa.estado}
                  forma={mesa.forma}
                  demorada={mesa.demorada}
                  etiqueta={etiquetaSegunEstado(mesa)}
                  selected={seleccionada === mesa.numero}
                  style={{
                    left: mesa.left,
                    top: mesa.top,
                    opacity: coincideFiltro(mesa, filtro) ? 1 : 0.25,
                    pointerEvents: coincideFiltro(mesa, filtro) ? 'auto' : 'none',
                  }}
                  onClick={() => setSeleccionada(mesa.numero)}
                />
              ))}
            </div>
          </div>
        </div>

        <DetalleMesaPanel
          mesas={mesasEjemplo}
          seleccionada={seleccionada}
          onSeleccionar={setSeleccionada}
          onVolver={() => setSeleccionada(null)}
        />
      </div>
    </div>
  )
}
