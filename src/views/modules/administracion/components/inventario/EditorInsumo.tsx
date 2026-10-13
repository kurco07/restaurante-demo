import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Insumo, InventarioSede } from '../../../../../models/types'
import { fetchPlatosPorInsumo } from '../../../../../models/services/inventarioService'

interface EditorInsumoProps {
  insumo: Insumo | null
  inventario: InventarioSede | undefined
  creando: boolean
  guardando: boolean
  onCrear: (datos: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] }) => Promise<void>
  onGuardar: (id: string, datos: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] }) => Promise<void>
  onGuardarStockMinimo: (inventarioSedeId: string, stockMinimo: number | null) => Promise<void>
  onEliminar: (id: string) => Promise<void>
  onCancelar: () => void
}

const TIPOS: { value: Insumo['tipo']; label: string }[] = [
  { value: 'exacto', label: 'Exacto (ej. 200g de proteína por plato)' },
  { value: 'por_lote', label: 'Por lote (ej. una salsa que rinde varias porciones)' },
  { value: 'estimado', label: 'Estimado (ej. condimentos "al gusto")' },
]

// Lista amplia a propósito (americana + europea + internacional) para no
// atar al restaurante a un solo sistema de medidas — "Otra" cubre lo que
// falte sin tener que mantener una tabla nueva en la base.
const GRUPOS_UNIDADES: { grupo: string; unidades: string[] }[] = [
  { grupo: 'Peso', unidades: ['g', 'kg', 'lb', 'oz'] },
  { grupo: 'Volumen', unidades: ['ml', 'l', 'gal', 'fl oz'] },
  { grupo: 'Unidad', unidades: ['unidad', 'docena', 'paquete', 'caja', 'bolsa'] },
]
const TODAS_UNIDADES = GRUPOS_UNIDADES.flatMap((g) => g.unidades)
const OTRA = '__otra__'

const FORM_VACIO = { nombre: '', unidad_de_medida: '', tipo: 'exacto' as Insumo['tipo'] }

export function EditorInsumo({
  insumo,
  inventario,
  creando,
  guardando,
  onCrear,
  onGuardar,
  onGuardarStockMinimo,
  onEliminar,
  onCancelar,
}: EditorInsumoProps) {
  const [form, setForm] = useState(() =>
    insumo
      ? { nombre: insumo.nombre, unidad_de_medida: insumo.unidad_de_medida, tipo: insumo.tipo }
      : FORM_VACIO,
  )
  const [unidadEsOtra, setUnidadEsOtra] = useState(
    () => Boolean(form.unidad_de_medida) && !TODAS_UNIDADES.includes(form.unidad_de_medida),
  )
  const [stockMinimo, setStockMinimo] = useState(inventario?.stock_minimo?.toString() ?? '')
  const [platos, setPlatos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!insumo) return
    let cancelado = false
    fetchPlatosPorInsumo(insumo.id).then((nombres) => {
      if (!cancelado) setPlatos(nombres)
    })
    return () => {
      cancelado = true
    }
  }, [insumo])

  if (!insumo && !creando) {
    return (
      <p className="text-center text-sm text-[var(--ink-soft)]">Selecciona un insumo de la lista, o crea uno nuevo.</p>
    )
  }

  function handleCambiarUnidadSelect(valor: string) {
    if (valor === OTRA) {
      setUnidadEsOtra(true)
      setForm((f) => ({ ...f, unidad_de_medida: '' }))
    } else {
      setUnidadEsOtra(false)
      setForm((f) => ({ ...f, unidad_de_medida: valor }))
    }
  }

  async function handleGuardar() {
    setError(null)
    try {
      if (creando) {
        await onCrear(form)
      } else if (insumo) {
        await onGuardar(insumo.id, form)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    }
  }

  async function handleGuardarStockMinimo() {
    if (!inventario) return
    setError(null)
    try {
      await onGuardarStockMinimo(inventario.id, stockMinimo.trim() === '' ? null : Number(stockMinimo))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el stock mínimo.')
    }
  }

  async function handleEliminar() {
    if (!insumo) return
    if (!confirm(`¿Eliminar "${insumo.nombre}"? Esto falla si está usado en alguna receta.`)) return
    setError(null)
    try {
      await onEliminar(insumo.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el insumo.')
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 text-[13px]">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            Nombre del insumo
          </span>
          <input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            Unidad de medida
          </span>
          <select
            value={unidadEsOtra ? OTRA : form.unidad_de_medida}
            onChange={(e) => handleCambiarUnidadSelect(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          >
            <option value="">Seleccionar unidad…</option>
            {GRUPOS_UNIDADES.map((g) => (
              <optgroup key={g.grupo} label={g.grupo}>
                {g.unidades.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={OTRA}>Otra (especificar)…</option>
          </select>
          {unidadEsOtra && (
            <input
              autoFocus
              placeholder="ej. bidón, saco, lata"
              value={form.unidad_de_medida}
              onChange={(e) => setForm((f) => ({ ...f, unidad_de_medida: e.target.value }))}
              className="mt-1.5 rounded-lg border border-[var(--border)] px-3 py-2"
            />
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            Tipo de descuento
          </span>
          <select
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as Insumo['tipo'] }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 rounded-lg bg-[var(--orange)] py-2.5 font-bold text-white disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : creando ? 'Crear insumo' : 'Guardar cambios'}
          </button>
          {creando ? (
            <button type="button" onClick={onCancelar} className="rounded-lg px-3 font-bold text-[var(--ink-soft)]">
              Cancelar
            </button>
          ) : (
            <button type="button" onClick={handleEliminar} className="rounded-lg px-3 font-bold text-[var(--red)]">
              Eliminar
            </button>
          )}
        </div>

        {error && <p className="text-[var(--red)]">{error}</p>}
      </div>

      {!creando && insumo && inventario && (
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <div className="mb-3 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--surface-alt)] px-3 py-[11px] text-xs leading-[1.4] text-[var(--ink-soft)]">
            Stock actual:{' '}
            <strong className="text-[var(--ink)]">
              {inventario.cantidad_actual} {insumo.unidad_de_medida}
            </strong>
            . Se actualiza automáticamente desde lotes, movimientos y entregas en cocina — no se edita aquí
            directamente.
          </div>

          <label className="mb-3 flex items-center justify-between gap-2 text-[13px]">
            <span className="font-semibold">Stock mínimo (alerta de bajo stock)</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="sin alerta"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                onBlur={handleGuardarStockMinimo}
                className="w-24 rounded-lg border border-[var(--border)] px-2 py-1.5 text-right"
              />
              <span className="text-[var(--ink-soft)]">{insumo.unidad_de_medida}</span>
            </div>
          </label>

          <p className="mb-2 text-[13px] font-bold">
            Usado en {platos.length} {platos.length === 1 ? 'receta' : 'recetas'}
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {platos.map((nombre) => (
              <span
                key={nombre}
                className="rounded-full bg-[var(--gray-bg)] px-[11px] py-[5px] text-[11.5px] font-semibold text-[var(--ink-soft)]"
              >
                {nombre}
              </span>
            ))}
          </div>

          {insumo.tipo === 'por_lote' && (
            <Link
              to={`/administracion/insumos/${insumo.id}/lotes`}
              className="block rounded-[10px] border border-[var(--border)] p-2.5 text-center text-[12.5px] font-bold text-[var(--orange-dark)]"
            >
              Ver lotes de este insumo →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
