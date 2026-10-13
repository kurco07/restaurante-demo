export interface FilaBarra {
  clave: string
  etiqueta: string
  valor: number
  detalle: string
}

interface ListaBarrasProps {
  filas: FilaBarra[]
  vacio: string
}

// Lista de barras horizontales: el largo de cada barra es su valor frente
// al mayor de la lista. Mismo estilo que "Ventas por categoría" de
// Administración → Reportes.
export function ListaBarras({ filas, vacio }: ListaBarrasProps) {
  if (filas.length === 0) return <p className="py-4 text-center text-[12.5px] text-[var(--ink-soft)]">{vacio}</p>

  const maximo = Math.max(...filas.map((f) => f.valor)) || 1

  return (
    <div className="flex flex-col gap-3.5">
      {filas.map((f) => (
        <div key={f.clave}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[12.5px]">
            <span className="truncate font-bold">{f.etiqueta}</span>
            <span className="shrink-0 text-[var(--ink-soft)]">{f.detalle}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--gray-bg)]">
            <div className="h-full rounded-full bg-[var(--orange)]" style={{ width: `${(f.valor / maximo) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
