import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePorAprobar } from '../../../../controllers/pedido/usePorAprobar'
import { useMesasSede, type MesaVista } from '../../../../controllers/mesonero/useMesasSede'
import { abrirMesa, atenderMesa, marcarMesaLibre, transferirMesa } from '../../../../models/services/sesionMesaService'
import { puedeSupervisar } from '../../../../lib/permisos'
import type { Usuario } from '../../../../models/types'
import { MesaCard } from './MesaCard'
import { DetalleMesaPanel } from './DetalleMesaPanel'
import { CierreCuentaModal } from './CierreCuentaModal'
import { SolicitudesAutopedidoModal } from './SolicitudesAutopedidoModal'
import { TransferirMesaModal } from './TransferirMesaModal'

export type { MesaVista }

type Filtro = 'todas' | 'mias' | 'qr' | 'libres' | 'otro' | 'limpiar'

const filtros: { key: Filtro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'mias', label: 'Mías' },
  { key: 'qr', label: 'Por QR sin atender' },
  { key: 'libres', label: 'Libres' },
  { key: 'otro', label: 'Otro mesonero' },
  { key: 'limpiar', label: 'Por limpiar' },
]

function coincideFiltro(mesa: MesaVista, filtro: Filtro) {
  if (filtro === 'todas') return true
  if (filtro === 'mias') return mesa.estado === 'mia'
  if (filtro === 'qr') return mesa.estado === 'sin_atender'
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
  const [mesaCierreId, setMesaCierreId] = useState<string | null>(null)
  const [verSolicitudes, setVerSolicitudes] = useState(false)
  const [mesaTransferirId, setMesaTransferirId] = useState<string | null>(null)
  const { tickets: solicitudesPorAprobar, aprobar, aprobandoId } = usePorAprobar()

  const mesas = useMesasSede(usuario)

  const contador = (f: Filtro) => mesas.filter((m) => coincideFiltro(m, f)).length

  async function abrirYTomarPedido(mesa: MesaVista) {
    if (!usuario.sede_id) return
    // Si el cliente la abrió por QR mientras tanto, se atiende esa misma
    // sesión en vez de abrir una segunda.
    if (mesa.sesionId) {
      await atenderMesa(mesa.sesionId, usuario.id)
      navigate(`/mesoneros/menu/${mesa.id}`)
      return
    }
    await abrirMesa({ id: mesa.id, tenant_id: usuario.tenant_id, sede_id: usuario.sede_id }, usuario.id)
    navigate(`/mesoneros/menu/${mesa.id}`)
  }

  async function marcarLibre(mesa: MesaVista) {
    await marcarMesaLibre(mesa.id)
    setSeleccionada(null)
  }

  const mesaCierre = mesas.find((m) => m.id === mesaCierreId) ?? null
  const mesaTransferir = mesas.find((m) => m.id === mesaTransferirId) ?? null

  return (
    <div>
      {solicitudesPorAprobar.length > 0 && (
        <button
          type="button"
          onClick={() => setVerSolicitudes(true)}
          className="mb-4 flex w-full items-center justify-between rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3 text-left text-sm font-bold text-orange-700 hover:bg-orange-100"
        >
          <span>
            🔔 {solicitudesPorAprobar.length} pedido{solicitudesPorAprobar.length > 1 ? 's' : ''} de autopedido por
            aprobar
          </span>
          <span className="rounded-full bg-orange-500 px-3 py-1 text-xs text-white">Revisar</span>
        </button>
      )}

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
              <span className="h-2.5 w-2.5 rounded-sm border border-sky-400 bg-sky-50" /> Pedido por QR sin atender
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
            <span className="flex items-center gap-1.5">
              🔔 Tiene un pedido nuevo por aprobar
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
                  pendienteAprobar={solicitudesPorAprobar.some((t) => t.sesionId === mesa.sesionId)}
                  etiqueta={
                    mesa.estado === 'libre'
                      ? 'Libre'
                      : mesa.estado === 'por_limpiar'
                        ? 'Limpiar'
                        : mesa.estado === 'sin_atender'
                          ? 'QR'
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
          porAprobar={solicitudesPorAprobar}
          aprobandoId={aprobandoId}
          onAprobar={aprobar}
          onMarcarLibre={marcarLibre}
          onVerPedido={(mesa) => navigate(`/mesoneros/menu/${mesa.id}`)}
          onCobrarYCerrar={(mesa) => setMesaCierreId(mesa.id)}
          onTransferir={puedeSupervisar(usuario.rol) ? (mesa) => setMesaTransferirId(mesa.id) : undefined}
        />
      </div>

      {mesaCierre && (
        <CierreCuentaModal
          mesa={mesaCierre}
          usuario={usuario}
          onCerrar={() => setMesaCierreId(null)}
          onCerrada={() => {
            setMesaCierreId(null)
            setSeleccionada(null)
          }}
        />
      )}

      {mesaTransferir?.sesionId && (
        <TransferirMesaModal
          mesa={mesaTransferir}
          usuario={usuario}
          onTransferir={async (mesoneroId) => {
            if (!mesaTransferir.sesionId) return
            await transferirMesa(mesaTransferir.sesionId, mesoneroId)
            setMesaTransferirId(null)
          }}
          onCerrar={() => setMesaTransferirId(null)}
        />
      )}

      {verSolicitudes && (
        <SolicitudesAutopedidoModal
          tickets={solicitudesPorAprobar}
          aprobandoId={aprobandoId}
          onAprobar={aprobar}
          onCerrar={() => setVerSolicitudes(false)}
        />
      )}
    </div>
  )
}
