import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePowerSyncWatch } from '../../../../controllers/usePowerSyncWatch'
import { abrirMesa, marcarMesaLibre } from '../../../../models/services/sesionMesaService'
import type { Usuario } from '../../../../models/types'
import { MesaCard } from './MesaCard'
import { DetalleMesaPanel } from './DetalleMesaPanel'

export interface MesaVista {
  id: string
  numero: string
  estado: 'libre' | 'mia' | 'otro' | 'por_limpiar'
  mesero?: string
  tiempoLabel?: string
}

interface MesaRow {
  id: string
  nombre_numero: string
  posicion_x: number | null
  posicion_y: number | null
  estado: 'libre' | 'ocupada' | 'por_limpiar'
}

interface SesionRow {
  id: string
  mesa_id: string
  mesonero_id: string | null
  abierta_en: string
}

interface UsuarioRow {
  id: string
  nombre: string
}

function etiquetaTiempo(abiertaEnIso: string) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(abiertaEnIso).getTime()) / 60000))
  return `${minutos} min`
}

type Filtro = 'todas' | 'mias' | 'libres' | 'otro' | 'limpiar'

const filtros: { key: Filtro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'mias', label: 'Mías' },
  { key: 'libres', label: 'Libres' },
  { key: 'otro', label: 'Otro mesonero' },
  { key: 'limpiar', label: 'Por limpiar' },
]

function coincideFiltro(mesa: MesaVista, filtro: Filtro) {
  if (filtro === 'todas') return true
  if (filtro === 'mias') return mesa.estado === 'mia'
  if (filtro === 'libres') return mesa.estado === 'libre'
  if (filtro === 'otro') return mesa.estado === 'otro'
  return mesa.estado === 'por_limpiar'
}

interface MapaMesasProps {
  usuario: Usuario
}

export function MapaMesas({ usuario }: MapaMesasProps) {
  const navigate = useNavigate()
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const mesasRaw = usePowerSyncWatch<MesaRow>('select * from mesas where sede_id = ?', [usuario.sede_id])
  const sesiones = usePowerSyncWatch<SesionRow>(
    "select * from sesiones_mesa where sede_id = ? and estado = 'abierta'",
    [usuario.sede_id],
  )
  const usuariosSede = usePowerSyncWatch<UsuarioRow>('select id, nombre from usuarios where tenant_id = ?', [
    usuario.tenant_id,
  ])

  const mesas: (MesaVista & { posicionX: number; posicionY: number })[] = mesasRaw.map((mesa) => {
    const sesion = sesiones.find((s) => s.mesa_id === mesa.id)

    let estado: MesaVista['estado']
    if (mesa.estado === 'libre') estado = 'libre'
    else if (mesa.estado === 'por_limpiar') estado = 'por_limpiar'
    else estado = sesion?.mesonero_id === usuario.id ? 'mia' : 'otro'

    return {
      id: mesa.id,
      numero: mesa.nombre_numero,
      estado,
      mesero: sesion ? usuariosSede.find((u) => u.id === sesion.mesonero_id)?.nombre : undefined,
      tiempoLabel: sesion ? etiquetaTiempo(sesion.abierta_en) : undefined,
      posicionX: mesa.posicion_x ?? 50,
      posicionY: mesa.posicion_y ?? 50,
    }
  })

  const contador = (f: Filtro) => mesas.filter((m) => coincideFiltro(m, f)).length

  async function abrirYTomarPedido(mesa: MesaVista) {
    if (!usuario.sede_id) return
    await abrirMesa({ id: mesa.id, tenant_id: usuario.tenant_id, sede_id: usuario.sede_id }, usuario.id)
    navigate(`/mesoneros/pedidos/${mesa.id}`)
  }

  async function marcarLibre(mesa: MesaVista) {
    await marcarMesaLibre(mesa.id)
    setSeleccionada(null)
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xl font-extrabold text-gray-900">{contador('mias')}</div>
          <div className="text-xs text-gray-500">Mesas asignadas</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xl font-extrabold text-gray-900">{mesas.filter((m) => m.estado !== 'libre').length}</div>
          <div className="text-xs text-gray-500">Ocupadas ahora</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xl font-extrabold text-gray-900">{contador('limpiar')}</div>
          <div className="text-xs text-gray-500">Por limpiar</div>
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

              {mesas.map((mesa) => (
                <MesaCard
                  key={mesa.id}
                  numero={mesa.numero}
                  estado={mesa.estado}
                  etiqueta={
                    mesa.estado === 'libre'
                      ? 'Libre'
                      : mesa.estado === 'por_limpiar'
                        ? 'Limpiar'
                        : mesa.estado === 'otro'
                          ? (mesa.mesero ?? '—')
                          : (mesa.tiempoLabel ?? '')
                  }
                  selected={seleccionada === mesa.id}
                  style={{
                    left: `${mesa.posicionX}%`,
                    top: `${mesa.posicionY}%`,
                    opacity: coincideFiltro(mesa, filtro) ? 1 : 0.25,
                    pointerEvents: coincideFiltro(mesa, filtro) ? 'auto' : 'none',
                  }}
                  onClick={() => setSeleccionada(mesa.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <DetalleMesaPanel
          mesas={mesas}
          seleccionada={seleccionada}
          onSeleccionar={setSeleccionada}
          onVolver={() => setSeleccionada(null)}
          onAbrirMesa={abrirYTomarPedido}
          onMarcarLibre={marcarLibre}
          onVerPedido={(mesa) => navigate(`/mesoneros/pedidos/${mesa.id}`)}
        />
      </div>
    </div>
  )
}
