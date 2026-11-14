import { useState } from 'react'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { EstadoChip } from './components/panel/EstadoChip'
import { NuevoEmpleadoModal } from './components/personal/NuevoEmpleadoModal'
import { usePersonal } from '../../../controllers/administracion/usePersonal'
import { enlaceAccesoEmpleado } from '../../../models/services/empleadoService'
import type { Rol } from '../../../models/types'

const ETIQUETA_ROL: Record<Rol, string> = {
  mesonero: 'Mesonero',
  cocina: 'Cocina',
  supervisor: 'Supervisor de sala',
  administracion: 'Administración',
  gerencia: 'Gerencia',
  super_admin: 'Super admin',
}

export default function PersonalPage() {
  const { usuario, loading, error } = useUsuario()
  const p = usePersonal()
  const [mostrarNuevoEmpleado, setMostrarNuevoEmpleado] = useState(false)
  const [creadoId, setCreadoId] = useState<string | null>(null)
  const [enlaceCreadoCopiado, setEnlaceCreadoCopiado] = useState(false)

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />
  if (p.cargando) return <LoadingSpinner message="Cargando empleados…" />
  if (p.error) return <ErrorMessage message={p.error} />

  return (
    <AdminLayout usuario={usuario}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--acento)]">Administración</div>
          <h1 className="mt-1 text-[27px] font-extrabold">Personal</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Buscar empleado..."
            value={p.busqueda}
            onChange={(e) => p.setBusqueda(e.target.value)}
            className="w-56 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px]"
          />
          <button
            type="button"
            onClick={() => setMostrarNuevoEmpleado(true)}
            className="whitespace-nowrap rounded-full bg-[var(--orange)] px-4 py-2.5 text-[12.5px] font-bold text-white"
          >
            + Nuevo empleado
          </button>
        </div>
      </header>

      {creadoId && (
        <div className="mb-4 rounded-xl bg-[var(--green-bg)] px-4 py-3 text-sm text-[var(--green)]">
          <p className="mb-1.5 font-semibold">Empleado creado — mándale este enlace, ya sabe quién es:</p>
          <p className="mb-1.5 break-all rounded-lg bg-white/60 px-3 py-2 text-[11.5px] text-[var(--ink)]">
            {enlaceAccesoEmpleado(creadoId)}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(enlaceAccesoEmpleado(creadoId)).then(
                  () => setEnlaceCreadoCopiado(true),
                  () => setEnlaceCreadoCopiado(false),
                )
              }
              className="text-[12px] font-bold"
            >
              {enlaceCreadoCopiado ? 'Copiado ✓' : 'Copiar enlace'}
            </button>
            <button type="button" onClick={() => setCreadoId(null)} className="text-[12px] font-bold text-[var(--ink-soft)]">
              Listo
            </button>
          </div>
        </div>
      )}

      {mostrarNuevoEmpleado && (
        <NuevoEmpleadoModal
          onCerrar={() => setMostrarNuevoEmpleado(false)}
          onCreado={(usuarioId) => {
            setMostrarNuevoEmpleado(false)
            setCreadoId(usuarioId)
            setEnlaceCreadoCopiado(false)
          }}
        />
      )}

      <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold">{p.totales.registrados}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Empleados registrados</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold text-[var(--green)]">{p.totales.activos}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Activos</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
          <div className="text-[23px] font-extrabold text-[var(--red)]">{p.totales.inactivos}</div>
          <div className="mt-[5px] text-xs text-[var(--ink-soft)]">Inactivo</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {p.filtros.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => p.setFiltro(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
              p.filtro === f.key
                ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-soft)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {p.empleados.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => p.setSeleccionadoId(emp.id)}
                  className={`cursor-pointer border-b border-[var(--border)] last:border-none hover:bg-[var(--surface-alt)] ${
                    p.seleccionado?.id === emp.id ? 'bg-[var(--surface-alt)]' : ''
                  } ${!emp.activo ? 'opacity-50' : ''}`}
                >
                  <td className="flex items-center gap-2.5 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--orange-bg)] text-[11px] font-extrabold text-[var(--orange-dark)]">
                      {emp.nombre.charAt(0)}
                    </span>
                    <div>
                      <div className="font-bold">{emp.nombre}</div>
                      <div className="text-[11px] text-[var(--ink-soft)]">{ETIQUETA_ROL[emp.rol]}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{emp.telefono ?? '—'}</td>
                  <td className="px-4 py-3">
                    <EstadoChip tono={emp.activo ? 'verde' : 'naranja'}>{emp.activo ? 'Activo' : 'Inactivo'}</EstadoChip>
                  </td>
                </tr>
              ))}
              {p.empleados.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[var(--ink-soft)]">
                    No hay empleados que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {p.seleccionado ? (
            <FichaEmpleado
              key={p.seleccionado.id}
              empleado={p.seleccionado}
              actuando={p.actuando}
              onActivarODesactivar={(activo) => p.activarODesactivar(p.seleccionado!.id, activo)}
              onEliminar={() => p.eliminar(p.seleccionado!.id)}
              onResetearContrasena={(nueva) => p.resetearContrasenaDe(p.seleccionado!.id, nueva)}
            />
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">Selecciona un empleado para ver su ficha.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

function FichaEmpleado({
  empleado,
  actuando,
  onActivarODesactivar,
  onEliminar,
  onResetearContrasena,
}: {
  empleado: NonNullable<ReturnType<typeof usePersonal>['seleccionado']>
  actuando: boolean
  onActivarODesactivar: (activo: boolean) => Promise<void>
  onEliminar: () => Promise<void>
  onResetearContrasena: (nueva: string) => Promise<void>
}) {
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [resetenando, setResetenando] = useState(false)
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [contrasenaCambiada, setContrasenaCambiada] = useState(false)
  const [enlaceCopiado, setEnlaceCopiado] = useState(false)
  const esAdministracion = empleado.rol === 'administracion'

  return (
    <>
      <p className="mb-4 text-base font-extrabold">Ficha de empleado</p>
      <div className="flex flex-col gap-3 text-[13px]">
        <Campo label="Nombre completo" valor={empleado.nombre} />
        <Campo label="Rol" valor={ETIQUETA_ROL[empleado.rol]} />
        <Campo label="Teléfono" valor={empleado.telefono ?? '—'} />
        <Campo label="Correo" valor={empleado.email ?? '—'} />
        <Campo label="Fecha de ingreso" valor={new Date(empleado.fechaIngreso).toLocaleDateString('es')} muted />

        {!esAdministracion && (
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
              Enlace de acceso
            </p>
            <p className="break-all rounded-lg bg-[var(--surface-alt)] px-3 py-2 text-[11.5px]">
              {enlaceAccesoEmpleado(empleado.id)}
            </p>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(enlaceAccesoEmpleado(empleado.id)).then(
                  () => setEnlaceCopiado(true),
                  () => setEnlaceCopiado(false),
                )
              }
              className="mt-1.5 text-[12px] font-bold text-[var(--orange-dark)]"
            >
              {enlaceCopiado ? 'Copiado ✓' : 'Copiar enlace'}
            </button>
            <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
              Mándaselo por WhatsApp, correo o dáselo en persona — ya sabe quién es, solo le pide la contraseña.
            </p>
          </div>
        )}

        <label className="mt-1 flex items-center justify-between text-[12.5px] font-semibold">
          Empleado activo
          <button
            type="button"
            role="switch"
            aria-checked={empleado.activo}
            disabled={actuando}
            onClick={() => onActivarODesactivar(!empleado.activo)}
            className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition disabled:opacity-50 ${
              empleado.activo ? 'bg-[var(--orange)]' : 'bg-[var(--border)]'
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white transition-transform ${empleado.activo ? 'translate-x-4' : ''}`}
            />
          </button>
        </label>

        <p className="rounded-lg border border-dashed border-[var(--border)] p-3 text-[11.5px] text-[var(--ink-soft)]">
          Acceso a: app de {empleado.rol === 'administracion' ? 'administración' : ETIQUETA_ROL[empleado.rol].toLowerCase()}.
          Desactivar bloquea su inicio de sesión de inmediato.
        </p>

        {!resetenando ? (
          <button
            type="button"
            onClick={() => {
              setResetenando(true)
              setContrasenaCambiada(false)
            }}
            className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-[13px] font-bold text-[var(--ink)]"
          >
            Resetear contraseña
          </button>
        ) : (
          <div className="rounded-lg border border-[var(--border)] p-3">
            {contrasenaCambiada ? (
              <>
                <p className="mb-2 text-[12.5px] font-semibold text-[var(--green)]">
                  Contraseña cambiada — dásela ahora al empleado, no se puede volver a ver.
                </p>
                <button
                  type="button"
                  onClick={() => setResetenando(false)}
                  className="w-full rounded-lg border border-[var(--border)] py-2 text-[13px] font-bold text-[var(--ink-soft)]"
                >
                  Listo
                </button>
              </>
            ) : (
              <>
                <label className="mb-2 flex flex-col gap-1 text-[11.5px] font-bold text-[var(--ink)]">
                  Nueva contraseña
                  <input
                    type="text"
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-[13px] font-normal"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetenando(false)
                      setNuevaContrasena('')
                    }}
                    className="flex-1 rounded-lg border border-[var(--border)] py-2 text-[13px] font-bold text-[var(--ink-soft)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={actuando || nuevaContrasena.length < 6}
                    onClick={async () => {
                      await onResetearContrasena(nuevaContrasena)
                      setNuevaContrasena('')
                      setContrasenaCambiada(true)
                    }}
                    className="flex-1 rounded-lg bg-[var(--orange)] py-2 text-[13px] font-bold text-white disabled:opacity-50"
                  >
                    {actuando ? 'Cambiando…' : 'Cambiar'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!confirmandoEliminar ? (
          <button
            type="button"
            onClick={() => setConfirmandoEliminar(true)}
            className="rounded-lg px-3 py-2.5 text-[13px] font-bold text-[var(--red)]"
          >
            Eliminar empleado
          </button>
        ) : (
          <div className="rounded-lg border border-[var(--red)] p-3">
            <p className="mb-2 text-[12.5px] font-semibold text-[var(--red)]">
              Esto borra su cuenta por completo. No se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoEliminar(false)}
                className="flex-1 rounded-lg border border-[var(--border)] py-2 text-[13px] font-bold text-[var(--ink-soft)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actuando}
                onClick={onEliminar}
                className="flex-1 rounded-lg bg-[var(--red)] py-2 text-[13px] font-bold text-white disabled:opacity-50"
              >
                {actuando ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Campo({ label, valor, muted }: { label: string; valor: string; muted?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">{label}</p>
      <p className={`rounded-lg bg-[var(--surface-alt)] px-3 py-2 font-semibold ${muted ? 'text-[var(--ink-soft)]' : ''}`}>
        {valor}
      </p>
    </div>
  )
}
