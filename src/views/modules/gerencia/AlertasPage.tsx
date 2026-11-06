import { Link } from 'react-router-dom'
import { useKpisGerencia } from '../../../controllers/gerencia/useKpisGerencia'
import type { AlertaGerencia, TipoAlerta } from '../../../models/types'
import { formatearMoneda } from '../../components/ui/constants'
import { SelectorSede } from './components/SelectorSede'

function fecha(dia: string) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

function n(valor: string | number | null | undefined) {
  return Number(valor ?? 0)
}

function cantidad(valor: string | number | null | undefined, unidad: unknown) {
  return `${n(valor).toLocaleString('es', { maximumFractionDigits: 3 })} ${String(unidad ?? '')}`.trim()
}

function pct(valor: string | number | null | undefined) {
  return `${n(valor).toLocaleString('es', { maximumFractionDigits: 1 })}%`
}

interface Texto {
  titulo: string
  detalle: string
  enlace: { label: string; to: string }
}

// Arma el título, la explicación y a dónde ir a ver el detalle de cada
// tipo de alerta. Los umbrales están en la migración 0020.
function texto(a: AlertaGerencia): Texto {
  const d = a.datos
  switch (a.tipo) {
    case 'merma_alta': {
      const motivos = [
        d.pct_sobre_promedio != null && n(d.pct_sobre_promedio) > 50
          ? `${pct(d.pct_sobre_promedio)} más que el promedio semanal (${formatearMoneda(n(d.promedio_semanal))})`
          : null,
        d.pct_de_ventas != null && n(d.pct_de_ventas) > 3 ? `${pct(d.pct_de_ventas)} de las ventas` : null,
      ].filter(Boolean)
      return {
        titulo: 'Merma alta',
        detalle: `Se perdieron ${formatearMoneda(n(d.merma))} en merma los últimos 7 días: ${motivos.join(' y ')}.`,
        enlace: { label: 'Ver inventario', to: '/gerencia/inventario' },
      }
    }
    case 'anulacion_preparada':
      return {
        titulo: 'Anulación de platos ya preparados',
        detalle:
          `Se anularon ${n(d.platos)} ${n(d.platos) === 1 ? 'plato' : 'platos'} que ya se estaban preparando o estaban listos, ` +
          `por ${formatearMoneda(n(d.importe))}. Sus ingredientes se registraron como merma. Anuló: ${String(d.anularon ?? '—')}.`,
        enlace: { label: 'Ver el reporte de ese día', to: `/gerencia/reportes?dia=${a.fecha}` },
      }
    case 'conteo_faltante':
      return {
        titulo: 'Faltante en conteo físico',
        detalle:
          `${String(d.insumo)}: faltaron ${cantidad(d.faltante, d.unidad)}` +
          (d.teorico != null ? ` de ${cantidad(d.teorico, d.unidad)} registrados` : '') +
          (d.pct != null ? ` (${pct(d.pct)})` : '') +
          (d.valor != null ? `, unos ${formatearMoneda(n(d.valor))}` : '') +
          '.',
        enlace: { label: 'Ver inventario', to: '/gerencia/inventario' },
      }
    case 'margen_negativo':
      return {
        titulo: 'Plato con margen negativo',
        detalle:
          `${String(d.plato)} cuesta ${formatearMoneda(n(d.costo_unitario))} y se cobra ${formatearMoneda(n(d.precio_promedio))} en promedio: ` +
          `se pierden ${formatearMoneda(Math.abs(n(d.margen_unitario)))} por plato ` +
          `(${formatearMoneda(n(d.ganancia))} en ${n(d.vendidos)} vendidos, últimos 30 días).`,
        enlace: { label: 'Ver rentabilidad', to: '/gerencia/rentabilidad' },
      }
    case 'ventas_caidas':
      return {
        titulo: 'Ventas caídas',
        detalle:
          `Se vendieron ${formatearMoneda(n(d.ventas))}, apenas el ${pct(d.pct)} del promedio de ese día de la semana ` +
          `(${formatearMoneda(n(d.promedio))}).`,
        enlace: { label: 'Ver el reporte de ese día', to: `/gerencia/reportes?dia=${a.fecha}` },
      }
    case 'stock_bajo':
      return {
        titulo: n(d.cantidad) <= 0 ? 'Insumo agotado' : 'Stock bajo mínimo',
        detalle: `${String(d.insumo)}: quedan ${cantidad(d.cantidad, d.unidad)} (mínimo ${cantidad(d.minimo, d.unidad)}).`,
        enlace: { label: 'Ver inventario', to: '/gerencia/inventario' },
      }
  }
}

const ORDEN_TIPOS: TipoAlerta[] = [
  'margen_negativo',
  'merma_alta',
  'conteo_faltante',
  'anulacion_preparada',
  'ventas_caidas',
  'stock_bajo',
]

const ETIQUETA_TIPO: Record<TipoAlerta, string> = {
  margen_negativo: 'Margen negativo',
  merma_alta: 'Merma alta',
  conteo_faltante: 'Conteo físico',
  anulacion_preparada: 'Anulaciones',
  ventas_caidas: 'Ventas caídas',
  stock_bajo: 'Stock bajo',
}

// Alertas y excepciones (Fase 5, Módulo 4): lo que gerencia tiene que
// mirar sin salir a buscarlo. Se calculan al momento en el servidor y
// solo se muestran: no hay "marcar como revisada" (decisión de Pedro).
// No usa el selector de período: cada alerta tiene su ventana fija.
export default function AlertasPage() {
  const k = useKpisGerencia()
  const altas = k.alertas.filter((a) => a.gravedad === 'alta').length
  const porTipo = ORDEN_TIPOS.map((t) => [t, k.alertas.filter((a) => a.tipo === t).length] as const).filter(([, c]) => c > 0)

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--acento)]">Gerencia</div>
          <h1 className="mt-1 text-[27px] font-extrabold">Alertas</h1>
          <p className="mt-0.5 text-xs text-[var(--ink-soft)]">Excepciones de los últimos días que conviene revisar</p>
        </div>
        <SelectorSede />
      </header>

      {k.errorAlertas && (
        <p className="mb-5 rounded-xl bg-[var(--red-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--red)]">
          No se pudieron cargar las alertas: {k.errorAlertas}
        </p>
      )}

      {k.cargandoAlertas && k.alertas.length === 0 && (
        <p className="py-16 text-center text-sm text-[var(--ink-soft)]">Cargando…</p>
      )}

      {!k.cargandoAlertas && !k.errorAlertas && k.alertas.length === 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center">
          <p className="text-[17px] font-extrabold text-[var(--green)]">Todo en orden</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">No hay ninguna excepción en este momento.</p>
        </div>
      )}

      {k.alertas.length > 0 && (
        <div className={k.cargandoAlertas ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="font-bold">
              {k.alertas.length} {k.alertas.length === 1 ? 'alerta' : 'alertas'}
              {altas > 0 && <span className="text-[var(--red)]"> · {altas} {altas === 1 ? 'grave' : 'graves'}</span>}
            </span>
            {porTipo.map(([t, c]) => (
              <span key={t} className="rounded-full bg-[var(--gray-bg)] px-2.5 py-1 font-semibold text-[var(--ink-soft)]">
                {ETIQUETA_TIPO[t]} · {c}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {k.alertas.map((a, i) => (
              <TarjetaAlerta key={`${a.tipo}-${a.sede_id}-${a.fecha}-${i}`} alerta={a} />
            ))}
          </div>
        </div>
      )}

      <details className="mt-8 text-xs text-[var(--ink-soft)]">
        <summary className="cursor-pointer font-semibold">Cómo se calculan</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Merma alta: merma de los últimos 7 días, en dinero, más de 50% sobre el promedio semanal de las 4 semanas anteriores, o más del 3% de las ventas.</li>
          <li>Anulación de platos ya preparados: más de $15 en un día, en los últimos 7 días.</li>
          <li>Faltante en conteo físico: más del 10% del stock registrado o más de $20, en los últimos 7 días.</li>
          <li>Margen negativo: platos vendidos en los últimos 30 días que cuestan más de lo que se cobran.</li>
          <li>Ventas caídas: un día de la última semana con menos del 60% del promedio de ese día de la semana.</li>
          <li>Stock bajo: insumos por debajo del mínimo configurado en Administración.</li>
        </ul>
      </details>
    </>
  )
}

function TarjetaAlerta({ alerta }: { alerta: AlertaGerencia }) {
  const t = texto(alerta)
  const alta = alerta.gravedad === 'alta'

  return (
    <article
      className={`rounded-2xl border border-l-4 border-[var(--border)] bg-[var(--surface)] px-5 py-4 ${
        alta ? 'border-l-[var(--red)]' : 'border-l-[var(--orange)]'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.05em] ${
            alta ? 'bg-[var(--red-bg)] text-[var(--red)]' : 'bg-[var(--orange-bg)] text-[var(--orange-dark)]'
          }`}
        >
          {alta ? 'Grave' : 'Revisar'}
        </span>
        <h2 className="text-[15px] font-extrabold">{t.titulo}</h2>
        {alerta.sede && <span className="text-xs text-[var(--ink-soft)]">· {alerta.sede}</span>}
        {alerta.fecha && <span className="text-xs text-[var(--ink-soft)] first-letter:uppercase">· {fecha(alerta.fecha)}</span>}
      </div>
      <p className="mt-1.5 text-[13px]">{t.detalle}</p>
      <Link to={t.enlace.to} className="mt-2 inline-block text-xs font-bold text-[var(--orange-dark)]">
        {t.enlace.label} →
      </Link>
    </article>
  )
}
