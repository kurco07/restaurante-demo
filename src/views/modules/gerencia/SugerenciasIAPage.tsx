import { useKpisGerencia } from '../../../controllers/gerencia/useKpisGerencia'
import { useProbarIA } from '../../../controllers/ia/useProbarIA'
import { useSugerenciasPlatos } from '../../../controllers/ia/useSugerenciasPlatos'
import { PanelCard } from '../../components/ui/PanelCard'
import { RevisarSugerenciaPlatos } from './components/RevisarSugerenciaPlatos'
import { SelectorSede } from './components/SelectorSede'

function esHoy(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

// Sugerencias de la IA para gerencia (Fase 6). Aquí viven los platos a
// preparar hoy (Módulo 3) y la prueba de conexión (Módulo 1). Las de
// compra las revisa administración en su módulo. Ninguna se aplica sola:
// la IA propone y una persona aprueba (CLAUDE.md).
export default function SugerenciasIAPage() {
  const k = useKpisGerencia()
  // Los platos son por sede: con una sola sede se usa esa; con varias,
  // la que esté elegida en el selector
  const sedeId = k.sedeId ?? (k.sedes.length === 1 ? k.sedes[0].id : null)
  const nombreSede = k.sedes.find((s) => s.id === sedeId)?.nombre
  const p = useSugerenciasPlatos(sedeId)
  const aprobadaHoy = p.revisadas.find((s) => s.estado === 'aprobada' && esHoy(s.generada_en))

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">Gerencia</div>
          <h1 className="mt-1 text-[27px] font-extrabold">Sugerencias IA</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-soft)]">La IA propone; una persona revisa y aprueba antes de que se haga nada</p>
        </div>
        <SelectorSede />
      </header>

      <PanelCard
        titulo="Platos a preparar hoy"
        subtitulo="Según el stock, lo que se vende este día, el margen y los insumos por vencer. Al aprobar, cocina ve la lista sin precios."
      >
        {!sedeId ? (
          <p className="py-2 text-[13px] text-[var(--ink-soft)]">Elige una sede arriba para ver o generar sus platos sugeridos.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {p.pendientes.length === 0 && (
                <button
                  type="button"
                  onClick={p.generar}
                  disabled={p.generando || p.cargando}
                  className="rounded-full bg-[var(--orange)] px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
                >
                  {p.generando ? 'Generando… (puede tardar)' : `✦ Generar para hoy${nombreSede ? ` · ${nombreSede}` : ''}`}
                </button>
              )}
              {aprobadaHoy && p.pendientes.length === 0 && (
                <span className="text-xs text-[var(--ink-soft)]">Ya hay una lista aprobada hoy; si generas otra y la apruebas, cocina verá la nueva.</span>
              )}
            </div>

            {p.error && (
              <p className="mb-4 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--red)]">{p.error}</p>
            )}
            {p.aviso && (
              <p className="mb-4 rounded-xl bg-[var(--green-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--green)]">{p.aviso}</p>
            )}
            {p.cargando && <p className="py-4 text-center text-sm text-[var(--ink-soft)]">Cargando…</p>}

            {p.pendientes.map((s) => (
              <RevisarSugerenciaPlatos
                key={s.id}
                sugerencia={s}
                nombreSede={nombreSede}
                guardando={p.guardando}
                onAprobar={(items) => p.aprobar(s.id, items)}
                onRechazar={(motivo) => p.rechazar(s.id, motivo)}
              />
            ))}

            {aprobadaHoy && (
              <div className="rounded-xl bg-[var(--green-bg)] px-4 py-3 text-[13px]">
                <p className="font-bold text-[var(--green)]">
                  En la cocina de {nombreSede ?? 'esta sede'} hoy
                  {aprobadaHoy.revisada_por && ` · aprobada por ${aprobadaHoy.revisada_por}`}
                </p>
                <p className="mt-1">{aprobadaHoy.aprobados.map((a) => `${a.plato} (${a.porciones})`).join(' · ')}</p>
              </div>
            )}

            {p.revisadas.length > 0 && (
              <details className="mt-4 text-[12.5px]">
                <summary className="cursor-pointer font-semibold text-[var(--ink-soft)]">Historial</summary>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {p.revisadas.map((s) => (
                    <li key={s.id} className="text-[var(--ink-soft)]">
                      <b className="text-[var(--ink)]">{new Date(s.generada_en).toLocaleDateString('es')}</b> · {s.estado}
                      {s.estado === 'aprobada' && ` · ${s.aprobados.length} platos`}
                      {s.motivoRechazo && ` · motivo: ${s.motivoRechazo}`}
                      {s.revisada_por && ` · por ${s.revisada_por}`}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </PanelCard>

      <ConexionIA />

      <PanelCard titulo="Otras sugerencias" subtitulo="Dónde está cada una">
        <ul className="list-disc space-y-1 pl-5 text-[13px]">
          <li>Sugerencias de compra: las revisa administración en Inventario → Sugerencias IA.</li>
          <li>Recomendados del día: próximamente.</li>
        </ul>
      </PanelCard>
    </>
  )
}

// Prueba de conexión con el proveedor de IA (Módulo 1)
function ConexionIA() {
  const { resultado, probando, probar } = useProbarIA()

  return (
    <PanelCard titulo="Conexión con la IA" subtitulo="Comprueba que la clave y el modelo configurados en Supabase funcionan">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={probar}
          disabled={probando}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-[12.5px] font-bold text-[var(--ink-soft)] disabled:opacity-60"
        >
          {probando ? 'Probando…' : 'Probar conexión'}
        </button>
        <span className="text-xs text-[var(--ink-soft)]">No envía ningún dato del restaurante.</span>
      </div>

      {resultado?.ok === true && (
        <p className="mt-4 rounded-xl bg-[var(--green-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--green)]">
          Conectada: {resultado.proveedor} · {resultado.modelo} respondió en{' '}
          {(resultado.milisegundos / 1000).toLocaleString('es', { maximumFractionDigits: 1 })} s.
        </p>
      )}

      {resultado?.ok === false && (
        <div className="mt-4 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] text-[var(--red)]">
          <p className="font-semibold">{resultado.mensaje}</p>
          {!!resultado.modelosDisponibles?.length && (
            <>
              <p className="mt-2 text-[var(--ink)]">
                Modelos que tu clave sí puede usar (pon uno en el secreto <code>GEMINI_MODELO</code>):
              </p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {resultado.modelosDisponibles.map((m) => (
                  <li key={m}>
                    <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[12px] text-[var(--ink)]">{m}</code>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </PanelCard>
  )
}
