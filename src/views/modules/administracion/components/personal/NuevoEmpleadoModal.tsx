import { useEffect, useState } from 'react'
import { fetchSedes } from '../../../../../models/services/kpisService'
import { crearEmpleado, type RolEmpleadoCreable } from '../../../../../models/services/empleadoService'
import type { SedeResumen } from '../../../../../models/types'

interface NuevoEmpleadoModalProps {
  onCreado: () => void
  onCerrar: () => void
}

const ROLES: { value: RolEmpleadoCreable; label: string }[] = [
  { value: 'mesonero', label: 'Mesonero' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'supervisor', label: 'Supervisor de sala' },
]

// Fase 7, Módulo 6: invita a un empleado nuevo dentro del propio tenant.
// El empleado define su contraseña por correo — acá nunca se escribe una.
export function NuevoEmpleadoModal({ onCreado, onCerrar }: NuevoEmpleadoModalProps) {
  const [sedes, setSedes] = useState<SedeResumen[]>([])
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<RolEmpleadoCreable>('mesonero')
  const [sedeId, setSedeId] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSedes().then((filas) => {
      setSedes(filas)
      if (filas.length === 1) setSedeId(filas[0].id)
    })
  }, [])

  async function confirmar() {
    if (!nombre.trim() || !email.trim()) return
    setEnviando(true)
    setError(null)
    try {
      await crearEmpleado({ nombre: nombre.trim(), email: email.trim(), rol, sedeId: sedeId || null })
      onCreado()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el empleado.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2b2118]/35 p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-extrabold text-[var(--ink)]">Nuevo empleado</p>
          <button type="button" onClick={onCerrar} className="text-lg text-[var(--ink-soft)] hover:text-[var(--ink)]" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
            Nombre
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="empleado@correo.com"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
            Rol
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolEmpleadoCreable)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {sedes.length > 1 && (
            <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
              Sede
              <select
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
              >
                <option value="">Sin sede asignada todavía</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

        <p className="mt-3 text-xs text-[var(--ink-soft)]">
          Le llega un correo a {email || 'esa dirección'} para que ponga su propia contraseña.
        </p>

        <div className="mt-4 flex gap-2.5">
          <button type="button" onClick={onCerrar} className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--ink-soft)]">
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={!nombre.trim() || !email.trim() || enviando}
            className="flex-1 rounded-xl bg-[var(--orange)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {enviando ? 'Invitando…' : 'Invitar empleado'}
          </button>
        </div>
      </div>
    </div>
  )
}
