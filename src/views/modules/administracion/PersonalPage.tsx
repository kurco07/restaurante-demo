import { useState } from 'react'
import { useUsuario } from '../../../controllers/usuario/useUsuario'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { AdminLayout } from './components/layout/AdminLayout'
import { EstadoChip } from './components/panel/EstadoChip'
import { NuevoEmpleadoModal } from './components/personal/NuevoEmpleadoModal'
import { usePersonal } from '../../../controllers/administracion/usePersonal'

export default function PersonalPage() {
  const { usuario, loading, error } = useUsuario()
  const p = usePersonal()
  const [mostrarNuevoEmpleado, setMostrarNuevoEmpleado] = useState(false)
  const [invitado, setInvitado] = useState(false)

  if (loading) return <LoadingSpinner message="Cargando tu perfil…" />
  if (error) return <ErrorMessage message={error} />
  if (!usuario) return <ErrorMessage message="No se encontró tu perfil (tenant/sede)." />

  return (
    <AdminLayout usuario={usuario}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">Administración</div>
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

      {invitado && (
        <p className="mb-4 rounded-xl bg-[var(--green-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--green)]">
          Invitación enviada — el empleado va a aparecer en la lista en cuanto acepte y entre por primera vez.
        </p>
      )}

      {mostrarNuevoEmpleado && (
        <NuevoEmpleadoModal
          onCerrar={() => setMostrarNuevoEmpleado(false)}
          onCreado={() => {
            setMostrarNuevoEmpleado(false)
            setInvitado(true)
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
                <th className="px-4 py-3">Turno</th>
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
                      <div className="text-[11px] text-[var(--ink-soft)]">{emp.puestoLabel}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{emp.turno}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{emp.telefono}</td>
                  <td className="px-4 py-3">
                    <EstadoChip tono={emp.activo ? 'verde' : 'naranja'}>{emp.activo ? 'Activo' : 'Inactivo'}</EstadoChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {p.seleccionado ? (
            <>
              <p className="mb-4 text-base font-extrabold">Editor de empleado</p>
              <div className="flex flex-col gap-3 text-[13px]">
                <Campo label="Nombre completo" valor={p.seleccionado.nombre} />
                <Campo label="Rol" valor={p.seleccionado.puestoLabel} />
                <Campo label="Turno" valor={p.seleccionado.turno} />
                <Campo label="Teléfono" valor={p.seleccionado.telefono} />
                <Campo label="Fecha de ingreso" valor={p.seleccionado.fechaIngreso} muted />
                <Campo label="Correo" valor={p.seleccionado.correo} />

                <label className="mt-1 flex items-center justify-between text-[12.5px] font-semibold">
                  Empleado activo
                  <span
                    className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 ${
                      p.seleccionado.activo ? 'bg-[var(--orange)]' : 'bg-[var(--border)]'
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        p.seleccionado.activo ? 'translate-x-4' : ''
                      }`}
                    />
                  </span>
                </label>

                <p className="rounded-lg border border-dashed border-[var(--border)] p-3 text-[11.5px] text-[var(--ink-soft)]">
                  Acceso a: app de {p.seleccionado.puesto === 'administracion' ? 'administración' : p.seleccionado.puestoLabel.toLowerCase()}.
                  El rol determina qué pantallas puede usar cada empleado — un cocinero solo ve la app de cocina.
                </p>

                <div className="mt-2 flex gap-2">
                  <button type="button" className="flex-1 rounded-lg bg-[var(--orange)] py-2.5 text-[13px] font-bold text-white">
                    Guardar cambios
                  </button>
                  <button type="button" className="rounded-lg px-3 text-[13px] font-bold text-[var(--red)]">
                    Eliminar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">Selecciona un empleado para ver su ficha.</p>
          )}
        </div>
      </div>
    </AdminLayout>
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
