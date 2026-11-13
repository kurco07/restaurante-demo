import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useHojaQR } from '../../../controllers/administracion/useHojaQR'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

type Tamano = 'grande' | 'mediano' | 'chico'

// Cuántas tarjetas entran por hoja (carta o A4) en cada tamaño
const TAMANOS: Record<Tamano, { etiqueta: string; columnas: string; qr: string; mesa: string }> = {
  grande: { etiqueta: 'Grande · 2 por hoja', columnas: 'grid-cols-1', qr: 'w-[9cm]', mesa: 'text-4xl' },
  mediano: { etiqueta: 'Mediano · 4 por hoja', columnas: 'grid-cols-2', qr: 'w-[6.5cm]', mesa: 'text-2xl' },
  chico: { etiqueta: 'Chico · 9 por hoja', columnas: 'grid-cols-3', qr: 'w-[4cm]', mesa: 'text-lg' },
}

// Hoja imprimible con el QR de cada mesa (Fase 8, Módulo 4, piloto). Cada
// tarjeta lleva el nombre y el logo del restaurante, el número de mesa y
// el QR de su autopedido. Página propia, sin la barra de administración,
// para que al imprimir salgan solo las tarjetas.
export default function HojaQRPage() {
  const { usuario, tarjetas, restaurante, cargando, error, origenLocal } = useHojaQR()
  const [tamano, setTamano] = useState<Tamano>('mediano')
  const t = TAMANOS[tamano]

  if (!usuario) return <LoadingSpinner message="Cargando tu perfil…" />
  if (!usuario.sede_id) return <ErrorMessage message="Tu usuario no tiene una sede asignada." />

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] print:bg-white">
      <div className="mx-auto max-w-[900px] px-4 py-6 print:max-w-none print:p-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <Link to="/administracion/mesas" className="text-xs font-bold text-[var(--orange-dark)]">
              ← Volver a Mesas
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold">QR de las mesas</h1>
            <p className="text-[12.5px] text-[var(--ink-soft)]">
              Una tarjeta por mesa. El cliente escanea y ve el menú de esa mesa para pedir.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={tamano}
              onChange={(e) => setTamano(e.target.value as Tamano)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              aria-label="Tamaño de las tarjetas"
            >
              {(Object.keys(TAMANOS) as Tamano[]).map((k) => (
                <option key={k} value={k}>
                  {TAMANOS[k].etiqueta}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={cargando || tarjetas.length === 0}
              className="rounded-lg bg-[var(--orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Imprimir
            </button>
          </div>
        </div>

        {origenLocal && (
          <p className="mb-4 rounded-lg border border-[var(--red)] bg-[var(--red-bg)] px-3 py-2 text-sm font-bold text-[var(--red)] print:hidden">
            Estás en una copia local de la app: estos QR abrirían tu computadora, no la app publicada. Genéralos desde
            la dirección publicada para imprimirlos.
          </p>
        )}

        {error && <ErrorMessage message={error} />}
        {cargando ? (
          <LoadingSpinner message="Preparando los QR…" />
        ) : tarjetas.length === 0 && !error ? (
          <p className="py-12 text-center text-sm text-[var(--ink-soft)]">
            Esta sede todavía no tiene mesas. Agrégalas en Administración → Mesas.
          </p>
        ) : (
          <div className={`grid gap-4 ${t.columnas} print:gap-3`}>
            {tarjetas.map((c) => (
              <div
                key={c.mesaId}
                className="flex break-inside-avoid flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] bg-white p-5 text-center text-[#2b2118] print:border-gray-400"
              >
                <div className="flex items-center gap-2">
                  {restaurante.logo && <img src={restaurante.logo} alt="" className="h-8 w-8 object-contain" />}
                  {restaurante.nombre && <span className="text-sm font-bold">{restaurante.nombre}</span>}
                </div>
                <div className={`font-extrabold ${t.mesa}`}>Mesa {c.mesa}</div>
                {/* El SVG lo arma la librería qrcode a partir de nuestro propio enlace */}
                <div
                  className={`aspect-square ${t.qr} [&>svg]:h-full [&>svg]:w-full`}
                  dangerouslySetInnerHTML={{ __html: c.svg }}
                />
                <div className="text-sm font-bold">Escanea para ver el menú y pedir</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
