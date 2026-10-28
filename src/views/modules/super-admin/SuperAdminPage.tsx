import { useEffect, useState } from 'react'
import {
  actualizarTenantAdmin,
  aplicarPresetModulos,
  fetchModulosTenant,
  fetchTenantsAdmin,
  fijarModuloTenant,
  marcarSuscripcion,
  type TenantAdmin,
} from '../../../models/services/superAdminService'
import { type ModuloOpcional } from '../../../models/services/modulosService'

interface InfoModulo {
  titulo: string
  descripcion: string
  icono: string
}

const INFO_MODULO: Record<ModuloOpcional, InfoModulo> = {
  ia_sugerencias_compra: { titulo: 'Sugerencias de compra', descripcion: 'La IA sugiere qué y cuánto comprar según stock y consumo', icono: '🛒' },
  ia_sugerencias_platos: { titulo: 'Platos a preparar', descripcion: 'La IA sugiere qué preparar hoy en la cocina', icono: '🍳' },
  ia_recomendados: { titulo: 'Recomendados del día', descripcion: 'Platos destacados en el menú del mesonero y el QR', icono: '⭐' },
  alertas_gerencia: { titulo: 'Alertas de gerencia', descripcion: 'Avisos de merma, anulaciones, stock bajo y más', icono: '🔔' },
  multi_sede: { titulo: 'Vista multi-sede', descripcion: 'Comparar reportes entre las sedes del restaurante', icono: '🏢' },
  realidad_aumentada: { titulo: 'Realidad aumentada', descripcion: 'Botón "Ver en RA" para mostrar el plato en 3D con cámara', icono: '📱' },
}

const GRUPOS_MODULOS: { label: string; modulos: ModuloOpcional[] }[] = [
  { label: 'Inteligencia Artificial', modulos: ['ia_sugerencias_compra', 'ia_sugerencias_platos', 'ia_recomendados'] },
  { label: 'Gerencia', modulos: ['alertas_gerencia', 'multi_sede'] },
  { label: 'Marketing', modulos: ['realidad_aumentada'] },
]

function Interruptor({ activo, onClick, disabled }: { activo: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={onClick}
      disabled={disabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        activo ? 'bg-orange-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          activo ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// Fase 7, Módulo 5 — panel del equipo del SaaS: lista todos los tenants
// (RLS, migración 0026, ya le da acceso entre tenants solo a super_admin)
// y permite cambiar plan/estado y marcar el cobro a mano (Módulo 3: cobro
// manual por ahora, decisión del dueño — Zelle/USDT/transferencia hasta
// que haya una pasarela que cubra Venezuela).
export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<TenantAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  // Los módulos ya no van en el modal: al elegir "Módulos" se reemplaza
  // esta misma vista por la de tarjetas (como la referencia), con un
  // botón de volver — no un popup encima.
  const [vistaModulosId, setVistaModulosId] = useState<string | null>(null)

  function recargar() {
    setCargando(true)
    fetchTenantsAdmin()
      .then(setTenants)
      .finally(() => setCargando(false))
  }

  useEffect(recargar, [])

  const seleccionado = tenants.find((t) => t.id === seleccionadoId) ?? null
  const tenantModulos = tenants.find((t) => t.id === vistaModulosId) ?? null

  if (cargando) return <div className="p-8 text-sm text-gray-500">Cargando restaurantes…</div>

  if (tenantModulos) {
    return <VistaModulos tenant={tenantModulos} onVolver={() => setVistaModulosId(null)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">Super Admin</h1>
      <p className="mb-6 text-sm text-gray-500">{tenants.length} restaurante(s) registrados en la plataforma.</p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-xs font-bold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Restaurante</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Suscripción</th>
              <th className="px-4 py-3">Próximo cobro</th>
              <th className="px-4 py-3">Sedes</th>
              <th className="px-4 py-3">Usuarios</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-semibold text-gray-900">{t.nombre}</td>
                <td className="px-4 py-3 capitalize">{t.plan}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      t.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {t.estado}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize">{t.suscripcion?.estado ?? '—'}</td>
                <td className="px-4 py-3">{t.suscripcion?.proximo_cobro ?? '—'}</td>
                <td className="px-4 py-3">{t.sedes}</td>
                <td className="px-4 py-3">{t.usuarios}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSeleccionadoId(t.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                    >
                      Gestionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaModulosId(t.id)}
                      className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100"
                    >
                      Módulos
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {seleccionado && (
        <PanelGestionTenant
          tenant={seleccionado}
          onCerrar={() => setSeleccionadoId(null)}
          onGuardado={() => {
            setSeleccionadoId(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

// Vista de tarjetas por módulo, agrupadas por categoría — reemplaza la
// tabla mientras está abierta (no es un modal encima).
function VistaModulos({ tenant, onVolver }: { tenant: TenantAdmin; onVolver: () => void }) {
  const [modulos, setModulos] = useState<Record<ModuloOpcional, boolean> | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    fetchModulosTenant(tenant.id).then(setModulos)
  }, [tenant.id])

  async function alternar(modulo: ModuloOpcional) {
    if (!modulos || ocupado) return
    const nuevoValor = !modulos[modulo]
    setModulos({ ...modulos, [modulo]: nuevoValor }) // optimista
    try {
      await fijarModuloTenant(tenant.id, modulo, nuevoValor)
    } catch {
      setModulos(modulos) // revierte si falló
    }
  }

  async function activarGrupo(modulosGrupo: ModuloOpcional[]) {
    if (!modulos) return
    setOcupado(true)
    try {
      await Promise.all(modulosGrupo.map((m) => fijarModuloTenant(tenant.id, m, true)))
      setModulos({ ...modulos, ...Object.fromEntries(modulosGrupo.map((m) => [m, true])) })
    } finally {
      setOcupado(false)
    }
  }

  async function aplicarPreset(plan: string) {
    setOcupado(true)
    try {
      await aplicarPresetModulos(tenant.id, plan)
      setModulos(await fetchModulosTenant(tenant.id))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button type="button" onClick={onVolver} className="mb-4 text-sm font-bold text-gray-500 hover:text-gray-800">
        ← Volver a restaurantes
      </button>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Módulos — {tenant.nombre}</h1>
          <p className="mt-1 text-sm text-gray-500">Activa o desactiva las funciones disponibles para este restaurante.</p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => aplicarPreset('starter')}
            disabled={ocupado}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 disabled:opacity-50"
          >
            Preset Starter
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('pro')}
            disabled={ocupado}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 disabled:opacity-50"
          >
            Preset Pro
          </button>
        </div>
      </div>

      {!modulos ? (
        <p className="text-sm text-gray-400">Cargando módulos…</p>
      ) : (
        <div className="flex flex-col gap-6">
          {GRUPOS_MODULOS.map((grupo) => {
            const activos = grupo.modulos.filter((m) => modulos[m]).length
            return (
              <section key={grupo.label} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-base font-extrabold text-gray-900">{grupo.label}</p>
                    <p className="text-xs text-gray-400">
                      {activos} / {grupo.modulos.length} módulos activos
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => activarGrupo(grupo.modulos)}
                    disabled={ocupado || activos === grupo.modulos.length}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-600 disabled:opacity-40"
                  >
                    Activar todos
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grupo.modulos.map((m) => (
                    <div key={m} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-lg">
                          {INFO_MODULO[m].icono}
                        </span>
                        <Interruptor activo={modulos[m]} onClick={() => alternar(m)} disabled={ocupado} />
                      </div>
                      <p className="text-sm font-bold text-gray-900">{INFO_MODULO[m].titulo}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{INFO_MODULO[m].descripcion}</p>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PanelGestionTenant({
  tenant,
  onCerrar,
  onGuardado,
}: {
  tenant: TenantAdmin
  onCerrar: () => void
  onGuardado: () => void
}) {
  const [plan, setPlan] = useState(tenant.plan)
  const [estado, setEstado] = useState(tenant.estado)
  const [estadoSuscripcion, setEstadoSuscripcion] = useState<'activa' | 'pausada' | 'cancelada'>(
    tenant.suscripcion?.estado ?? 'activa',
  )
  const [proveedor, setProveedor] = useState(tenant.suscripcion?.proveedor_de_pago ?? 'manual')
  const [referencia, setReferencia] = useState(tenant.suscripcion?.referencia_externa ?? '')
  const [proximoCobro, setProximoCobro] = useState(tenant.suscripcion?.proximo_cobro ?? '')
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    try {
      await actualizarTenantAdmin(tenant.id, { plan, estado })
      if (tenant.suscripcion) {
        await marcarSuscripcion(tenant.suscripcion.id, {
          estado: estadoSuscripcion as 'activa' | 'pausada' | 'cancelada',
          proveedor_de_pago: proveedor,
          referencia_externa: referencia || null,
          proximo_cobro: proximoCobro || null,
        })
      }
      onGuardado()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-extrabold text-gray-900">{tenant.nombre}</p>
          <button type="button" onClick={onCerrar} className="text-lg text-gray-400 hover:text-gray-700" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex gap-3">
            <label className="flex-1 flex flex-col gap-1 text-xs font-bold text-gray-700">
              Plan
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 font-normal">
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </label>
            <label className="flex-1 flex flex-col gap-1 text-xs font-bold text-gray-700">
              Estado del tenant
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 font-normal">
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </label>
          </div>

          <hr className="my-1 border-gray-200" />
          <p className="text-xs font-extrabold uppercase tracking-wide text-gray-400">Suscripción (cobro manual)</p>

          <label className="flex flex-col gap-1 text-xs font-bold text-gray-700">
            Estado de la suscripción
            <select
              value={estadoSuscripcion}
              onChange={(e) => setEstadoSuscripcion(e.target.value as 'activa' | 'pausada' | 'cancelada')}
              className="rounded-lg border border-gray-300 px-3 py-2 font-normal"
            >
              <option value="activa">Activa / pagada</option>
              <option value="pausada">Pausada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>
          <div className="flex gap-3">
            <label className="flex-1 flex flex-col gap-1 text-xs font-bold text-gray-700">
              Medio de pago
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="zelle, usdt, transferencia…"
                className="rounded-lg border border-gray-300 px-3 py-2 font-normal"
              />
            </label>
            <label className="flex-1 flex flex-col gap-1 text-xs font-bold text-gray-700">
              Referencia
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="últimos 4, confirmación…"
                className="rounded-lg border border-gray-300 px-3 py-2 font-normal"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-bold text-gray-700">
            Próximo cobro
            <input
              type="date"
              value={proximoCobro}
              onChange={(e) => setProximoCobro(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 font-normal"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2.5">
          <button type="button" onClick={onCerrar} className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-bold text-gray-500">
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="flex-1 rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
