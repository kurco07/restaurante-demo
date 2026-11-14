import { useEffect, useState } from 'react'
import { fetchSedes } from '../../../../../models/services/kpisService'
import { crearEmpleado, type RolEmpleadoCreable } from '../../../../../models/services/empleadoService'
import type { SedeResumen } from '../../../../../models/types'
import { mensajeDeError } from '../../../../../lib/errores'

interface NuevoEmpleadoModalProps {
  onCreado: () => void
  onCerrar: () => void
}

const ROLES: { value: RolEmpleadoCreable; label: string }[] = [
  { value: 'mesonero', label: 'Mesonero' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'supervisor', label: 'Supervisor de sala' },
]

// Fase 7, Módulo 6: crea un empleado nuevo dentro del propio tenant.
// Administración pone la contraseña acá mismo (decisión del dueño,
// 2026-11-14) — el empleado nunca la elige ni la cambia él mismo. Hay
// que apuntarla para dársela (por WhatsApp, en persona, como sea):
// una vez creada, nadie puede volver a verla, solo resetearla.
export function NuevoEmpleadoModal({ onCreado, onCerrar }: NuevoEmpleadoModalProps) {
  const [sedes, setSedes] = useState<SedeResumen[]>([])
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<RolEmpleadoCreable>('mesonero')
  const [sedeId, setSedeId] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSedes().then((filas) => {
      setSedes(filas)
      if (filas.length === 1) setSedeId(filas[0].id)
    })
  }, [])

  const passwordValida = password.length >= 6

  async function confirmar() {
    if (!nombre.trim() || !email.trim() || !passwordValida) return
    setEnviando(true)
    setError(null)
    try {
      await crearEmpleado({ nombre: nombre.trim(), email: email.trim(), rol, sedeId: sedeId || null, password })
      onCreado()
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo crear el empleado.'))
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
          <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
            Contraseña
            <div className="relative flex items-center">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 pr-16 text-sm font-normal"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                className="absolute right-3 text-[11px] font-bold text-[var(--orange-dark)]"
              >
                {mostrarPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

        <p className="mt-3 text-xs text-[var(--ink-soft)]">
          Tú eliges esta contraseña — apúntala para dársela al empleado (por WhatsApp, en persona, como prefieras).
          Después de creada, nadie puede volver a verla, solo resetearla desde su ficha.
        </p>

        <div className="mt-4 flex gap-2.5">
          <button type="button" onClick={onCerrar} className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--ink-soft)]">
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={!nombre.trim() || !email.trim() || !passwordValida || enviando}
            className="flex-1 rounded-xl bg-[var(--orange)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {enviando ? 'Creando…' : 'Crear empleado'}
          </button>
        </div>
      </div>
    </div>
  )
}
