import type { ReactNode } from 'react'
import type { ReporteDiario } from '../../../models/types'
import { ETIQUETA_METODO_PAGO, formatearMoneda } from '../ui/constants'
import { PanelCard } from '../ui/PanelCard'

const ETIQUETA_ESTADO_ANULADO: Record<string, string> = {
  pendiente: 'En espera',
  en_preparacion: 'En preparación',
  listo: 'Listo',
}

function metodo(m: string) {
  return ETIQUETA_METODO_PAGO[m] ?? m
}

// Contenido del reporte de un día (Fase 5, Módulo 2), compartido entre la
// pantalla del supervisor (hoy, su sede) y la de gerencia (cualquier día).
// Solo ventas, cobros y anulaciones: sin costos, a propósito (§4.10).
// Necesita las variables de color de ESTILOS_ADMIN en un contenedor padre.
export function ReporteDiarioVista({ r }: { r: ReporteDiario }) {
  const a = r.anulaciones

  return (
    <>
      {r.es_hoy && r.mesas_abiertas > 0 && (
        <p className="mb-5 rounded-xl bg-[var(--orange-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--orange-dark)]">
          {r.mesas_abiertas === 1 ? 'Queda 1 mesa abierta' : `Quedan ${r.mesas_abiertas} mesas abiertas`} sin cobrar:
          todavía no entran en este reporte.
        </p>
      )}

      <div className="mb-[22px] grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Tarjeta valor={formatearMoneda(r.resumen.ventas)} etiqueta="Ventas (sin propina)" />
        <Tarjeta valor={formatearMoneda(r.resumen.propinas)} etiqueta="Propinas" />
        <Tarjeta valor={formatearMoneda(r.resumen.total_cobrado)} etiqueta="Total cobrado" />
        <Tarjeta valor={String(r.resumen.cuentas)} etiqueta={`Cuentas · ticket ${formatearMoneda(r.resumen.ticket_promedio)}`} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <PanelCard titulo="Medios de pago" subtitulo="Lo que debería haber en caja por método">
          <Tabla
            vacio="Sin cobros este día."
            columnas={['Método', 'Cuentas', 'Ventas', 'Propinas', 'Total']}
            filas={r.por_metodo.map((m) => [
              metodo(m.metodo),
              m.cuentas,
              formatearMoneda(m.ventas),
              formatearMoneda(m.propinas),
              <b key="t">{formatearMoneda(m.ventas + m.propinas)}</b>,
            ])}
            total={
              r.por_metodo.length > 1
                ? [
                    'Total',
                    r.resumen.cuentas,
                    formatearMoneda(r.resumen.ventas),
                    formatearMoneda(r.resumen.propinas),
                    formatearMoneda(r.resumen.total_cobrado),
                  ]
                : undefined
            }
          />
        </PanelCard>

        <PanelCard titulo="Por mesonero" subtitulo="Mesonero asignado a la mesa al cobrar">
          <Tabla
            vacio="Sin cobros este día."
            columnas={['Mesonero', 'Cuentas', 'Ventas', 'Propinas']}
            filas={r.por_mesonero.map((m) => [
              m.mesonero,
              m.cuentas,
              formatearMoneda(m.ventas),
              formatearMoneda(m.propinas),
            ])}
          />
        </PanelCard>
      </div>

      <PanelCard
        titulo="Anulaciones"
        subtitulo={
          a.platos === 0
            ? 'Platos anulados este día'
            : `${a.platos} ${a.platos === 1 ? 'plato' : 'platos'} · ${formatearMoneda(a.importe)} que no se cobraron` +
              (a.con_merma > 0 ? ` · ${a.con_merma} con merma (ya se habían preparado)` : '')
        }
      >
        <Tabla
          vacio="No se anuló nada este día."
          columnas={['Hora', 'Mesa', 'Plato', 'Importe', 'Estaba', 'Motivo', 'Anuló']}
          filas={a.detalle.map((x) => [
            x.hora,
            x.mesa,
            `${x.cantidad > 1 ? `${x.cantidad}× ` : ''}${x.plato}`,
            formatearMoneda(x.importe),
            <span
              key="e"
              className={
                x.anulado_desde === 'pendiente' ? '' : 'font-semibold text-[var(--red)]'
              }
              title={x.anulado_desde === 'pendiente' ? undefined : 'Los ingredientes se registraron como merma'}
            >
              {ETIQUETA_ESTADO_ANULADO[x.anulado_desde] ?? x.anulado_desde}
            </span>,
            x.motivo,
            x.anulado_por,
          ])}
        />
      </PanelCard>

      <PanelCard titulo="Cobros" subtitulo="Cada pago registrado, en orden de hora">
        <Tabla
          vacio="Sin cobros este día."
          columnas={['Hora', 'Mesa', 'Mesonero', 'Cobró', 'Método', 'Monto', 'Propina']}
          filas={r.cobros.map((c) => [
            c.hora,
            c.mesa,
            c.mesonero,
            c.cobrado_por,
            metodo(c.metodo),
            formatearMoneda(c.monto),
            formatearMoneda(c.propina),
          ])}
        />
      </PanelCard>
    </>
  )
}

function Tarjeta({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4">
      <div className="text-[23px] font-extrabold">{valor}</div>
      <div className="mt-[5px] text-xs text-[var(--ink-soft)]">{etiqueta}</div>
    </div>
  )
}

interface TablaProps {
  columnas: string[]
  filas: ReactNode[][]
  total?: ReactNode[]
  vacio: string
}

// Tabla simple con scroll horizontal en pantallas chicas (tablet o celular
// del supervisor).
function Tabla({ columnas, filas, total, vacio }: TablaProps) {
  if (filas.length === 0) return <p className="py-4 text-center text-[12.5px] text-[var(--ink-soft)]">{vacio}</p>

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.05em] text-[var(--ink-soft)]">
            {columnas.map((c) => (
              <th key={c} className="whitespace-nowrap px-1 pb-2 font-bold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-0">
              {f.map((celda, j) => (
                <td key={j} className={`px-1 py-2 ${j === 0 ? 'font-bold' : ''}`}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {total && (
          <tfoot>
            <tr className="border-t-2 border-[var(--border)] font-extrabold">
              {total.map((celda, j) => (
                <td key={j} className="px-1 pt-2">
                  {celda}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
