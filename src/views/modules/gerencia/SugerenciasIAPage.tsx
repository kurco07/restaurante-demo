import { useProbarIA } from '../../../controllers/ia/useProbarIA'
import { PanelCard } from '../../components/ui/PanelCard'

// Sugerencias de la IA (Fase 6). Por ahora solo el Módulo 1: comprobar
// que la conexión con el proveedor funciona. Aquí llegan después las
// sugerencias de compra, de platos a preparar y los recomendados del día,
// cada una con su aprobación: la IA nunca ejecuta nada sola (CLAUDE.md).
export default function SugerenciasIAPage() {
  const { resultado, probando, probar } = useProbarIA()

  return (
    <>
      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--orange-dark)]">Gerencia</div>
        <h1 className="mt-1 text-[27px] font-extrabold">Sugerencias IA</h1>
        <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
          La IA propone; una persona revisa y aprueba antes de que se haga nada
        </p>
      </header>

      <PanelCard titulo="Conexión con la IA" subtitulo="Comprueba que la clave y el modelo configurados en Supabase funcionan">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={probar}
            disabled={probando}
            className="rounded-full bg-[var(--orange)] px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
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

      <PanelCard titulo="Próximamente" subtitulo="Lo que va a aparecer en esta página">
        <ul className="list-disc space-y-1 pl-5 text-[13px]">
          <li>Sugerencias de compra según el consumo de cada insumo.</li>
          <li>Qué platos conviene preparar según el inventario y la rentabilidad.</li>
          <li>Recomendados del día.</li>
        </ul>
        <p className="mt-3 text-xs text-[var(--ink-soft)]">
          Ninguna se aplica sola: cada sugerencia queda pendiente hasta que alguien la apruebe o la rechace.
        </p>
      </PanelCard>
    </>
  )
}
