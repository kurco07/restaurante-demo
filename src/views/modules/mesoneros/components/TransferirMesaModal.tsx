import { useState } from 'react'
import { usePowerSyncWatch } from '../../../../controllers/usePowerSyncWatch'
import type { MesaVista } from '../../../../controllers/mesonero/useMesasSede'
import type { Usuario } from '../../../../models/types'

interface MesoneroRow {
  id: string
  nombre: string
  rol: string
}

interface TransferirMesaModalProps {
  mesa: MesaVista
  usuario: Usuario
  onTransferir: (mesoneroId: string) => Promise<void>
  onCerrar: () => void
}

// Pasar una mesa abierta a otro mesonero de la sede (solo supervisor,
// Fase 2 Módulo 7). Lectura local de usuarios: funciona sin internet.
export function TransferirMesaModal({ mesa, usuario, onTransferir, onCerrar }: TransferirMesaModalProps) {
  const mesoneros = usePowerSyncWatch<MesoneroRow>(
    `select id, nombre, rol from usuarios
      where tenant_id = ? and sede_id = ? and rol in ('mesonero', 'supervisor')
      order by nombre`,
    [usuario.tenant_id, usuario.sede_id],
  )
  const [enviandoId, setEnviandoId] = useState<string | null>(null)

  const candidatos = mesoneros.filter((m) => m.id !== mesa.mesoneroId)

  async function elegir(id: string) {
    setEnviandoId(id)
    try {
      await onTransferir(id)
    } finally {
      setEnviandoId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2b2118]/35 p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-base font-extrabold text-gray-900">Transferir mesa {mesa.numero}</p>
          <button type="button" onClick={onCerrar} className="text-lg text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          La atiende {mesa.mesero ?? 'nadie'}. El pedido y la cuenta pasan completos al mesonero que elijas.
        </p>

        {candidatos.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No hay otros mesoneros en esta sede.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {candidatos.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={enviandoId !== null}
                onClick={() => elegir(m.id)}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-bold text-gray-800 hover:border-[var(--orange)] disabled:opacity-50"
              >
                <span>
                  {m.nombre}
                  {m.id === usuario.id && <span className="ml-1.5 text-xs font-semibold text-gray-400">(tú)</span>}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  {enviandoId === m.id ? 'Transfiriendo…' : m.rol === 'supervisor' ? 'Supervisor' : 'Mesonero'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
