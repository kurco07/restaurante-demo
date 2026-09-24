import { useState, type FormEvent } from 'react'
import type { Insumo, Receta } from '../../../../models/types'

const NUEVO_INSUMO = '__nuevo__'

interface RecetaEditorProps {
  receta: Receta[]
  insumos: Insumo[]
  onAgregarLinea: (linea: {
    insumoId?: string
    insumoNuevo?: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] }
    cantidadRequerida: number
    unidad: string
  }) => Promise<void>
  onEliminarLinea: (recetaId: string) => Promise<void>
}

export function RecetaEditor({ receta, insumos, onAgregarLinea, onEliminarLinea }: RecetaEditorProps) {
  const [insumoId, setInsumoId] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaUnidadMedida, setNuevaUnidadMedida] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState<Insumo['tipo']>('exacto')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esInsumoNuevo = insumoId === NUEVO_INSUMO

  function insumoNombre(id: string) {
    return insumos.find((i) => i.id === id)?.nombre ?? '(insumo eliminado)'
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!insumoId) {
      setError('Selecciona un insumo.')
      return
    }

    setSubmitting(true)
    try {
      await onAgregarLinea({
        insumoId: esInsumoNuevo ? undefined : insumoId,
        insumoNuevo: esInsumoNuevo
          ? { nombre: nuevoNombre.trim(), unidad_de_medida: nuevaUnidadMedida.trim(), tipo: nuevoTipo }
          : undefined,
        cantidadRequerida: Number(cantidad),
        unidad: unidad.trim(),
      })
      setInsumoId('')
      setNuevoNombre('')
      setNuevaUnidadMedida('')
      setCantidad('')
      setUnidad('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el insumo a la receta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-orange-50/50 p-3.5">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-orange-600">
        Ingredientes de la receta
      </p>

      <div className="flex flex-col">
        {receta.map((linea) => (
          <div
            key={linea.id}
            className="flex items-center gap-3 border-b border-orange-100 py-2.5 text-sm last:border-none"
          >
            <span className="flex-1 font-semibold text-gray-800">{insumoNombre(linea.insumo_id)}</span>
            <span className="text-xs text-gray-500">
              {linea.cantidad_requerida} {linea.unidad}
            </span>
            <button
              type="button"
              onClick={() => onEliminarLinea(linea.id)}
              className="rounded-full px-2 py-0.5 text-xs font-bold text-gray-400 hover:bg-red-100 hover:text-red-600"
            >
              Quitar
            </button>
          </div>
        ))}
        {receta.length === 0 && (
          <p className="py-2 text-sm text-gray-500">Este plato todavía no tiene receta.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-end gap-2 border-t border-orange-100 pt-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Insumo
          <select
            value={insumoId}
            onChange={(event) => {
              const value = event.target.value
              setInsumoId(value)
              const insumo = insumos.find((i) => i.id === value)
              if (insumo) setUnidad(insumo.unidad_de_medida)
            }}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">Selecciona…</option>
            {insumos.map((insumo) => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre}
              </option>
            ))}
            <option value={NUEVO_INSUMO}>+ Nuevo insumo</option>
          </select>
        </label>

        {esInsumoNuevo && (
          <>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              Nombre del insumo
              <input
                type="text"
                required
                value={nuevoNombre}
                onChange={(event) => setNuevoNombre(event.target.value)}
                className="w-32 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              Unidad de medida
              <input
                type="text"
                placeholder="kg, g, l…"
                required
                value={nuevaUnidadMedida}
                onChange={(event) => setNuevaUnidadMedida(event.target.value)}
                className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              Tipo
              <select
                value={nuevoTipo}
                onChange={(event) => setNuevoTipo(event.target.value as Insumo['tipo'])}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="exacto">Exacto</option>
                <option value="por_lote">Por lote</option>
                <option value="estimado">Estimado</option>
              </select>
            </label>
          </>
        )}

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Cantidad
          <input
            type="number"
            step="0.001"
            min="0"
            required
            value={cantidad}
            onChange={(event) => setCantidad(event.target.value)}
            className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
          Unidad en la receta
          <input
            type="text"
            placeholder="g, ml, unidad…"
            required
            value={unidad}
            onChange={(event) => setUnidad(event.target.value)}
            className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-orange-500 px-3.5 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? 'Agregando…' : 'Agregar'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
