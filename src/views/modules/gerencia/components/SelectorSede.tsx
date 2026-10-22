import { useKpisGerencia } from '../../../../controllers/gerencia/useKpisGerencia'

// "Todas las sedes" (consolidado) o una sede en particular, compartido por
// todas las secciones del panel (Fase 5, Módulo 3). Con una sola sede no
// hay nada que elegir y no se muestra.
export function SelectorSede() {
  const { sedes, sedeId, setSedeId } = useKpisGerencia()
  if (sedes.length < 2) return null

  return (
    <select
      value={sedeId ?? ''}
      onChange={(e) => setSedeId(e.target.value || undefined)}
      aria-label="Sede"
      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-[9px] text-[12.5px] font-semibold text-[var(--ink)]"
    >
      <option value="">Todas las sedes</option>
      {sedes.map((s) => (
        <option key={s.id} value={s.id}>
          {s.nombre}
        </option>
      ))}
    </select>
  )
}
