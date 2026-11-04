import { useState } from 'react'
import type { SedeConfig } from '../../../../../models/types'
import { SeccionConfig } from './SeccionConfig'

interface DatosRestauranteSeccionProps {
  sede: SedeConfig
  onGuardar: (cambios: Partial<SedeConfig>) => Promise<void>
}

// El nombre de la sede se edita acá (para renombrar el local); el nombre
// de MARCA mostrado al público es otra cosa, se edita en Configuración →
// Marca (ColoresMarcaSeccion) — conceptos distintos a propósito.
export function DatosRestauranteSeccion({ sede, onGuardar }: DatosRestauranteSeccionProps) {
  const [nombre, setNombre] = useState(sede.nombre)
  const [direccion, setDireccion] = useState(sede.direccion ?? '')
  const [telefono, setTelefono] = useState(sede.telefono ?? '')
  const [horario, setHorario] = useState(sede.horario ?? '')
  const [estado, setEstado] = useState<'inactivo' | 'guardando' | 'guardado' | 'error'>('inactivo')

  async function guardar() {
    setEstado('guardando')
    try {
      await onGuardar({ nombre: nombre.trim(), direccion: direccion.trim() || null, telefono: telefono.trim() || null, horario: horario.trim() || null })
      setEstado('guardado')
    } catch {
      setEstado('error')
    }
  }

  return (
    <SeccionConfig titulo="Datos del restaurante" subtitulo="Esta información aparece en la app pública y en los recibos de esta sede">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
          Nombre de la sede
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-[var(--ink)]">
          Dirección
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
          />
        </label>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-xs font-bold text-[var(--ink)]">
            Teléfono
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs font-bold text-[var(--ink)]">
            Horario de atención
            <input
              type="text"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="Lun–Dom, 11:00 a.m. – 11:00 p.m."
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={guardar}
            disabled={!nombre.trim() || estado === 'guardando'}
            className="w-fit rounded-lg bg-[var(--orange)] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {estado === 'guardando' ? 'Guardando…' : 'Guardar datos'}
          </button>
          {estado === 'guardado' && <span className="text-xs font-semibold text-[var(--green)]">Guardado</span>}
          {estado === 'error' && <span className="text-xs font-semibold text-[var(--red)]">No se pudo guardar</span>}
        </div>
      </div>
    </SeccionConfig>
  )
}
