import { cerrarAviso, useAvisos, type TipoAviso } from '../../../controllers/avisos/avisos'

const ESTILO: Record<TipoAviso, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  exito: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-gray-200 bg-white text-gray-800',
}

const ICONO: Record<TipoAviso, string> = { error: '⚠', exito: '✓', info: 'ℹ' }

// Los avisos de toda la app, abajo al centro (en el celular no tapan la
// barra de arriba ni los botones de los costados)
export function Avisos() {
  const avisos = useAvisos()
  if (avisos.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[1000] print:hidden flex flex-col items-center gap-2 px-4"
    >
      {avisos.map((a) => (
        <div
          key={a.id}
          role={a.tipo === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${ESTILO[a.tipo]}`}
        >
          <span aria-hidden className="font-bold">
            {ICONO[a.tipo]}
          </span>
          <p className="flex-1">{a.texto}</p>
          <button
            type="button"
            onClick={() => cerrarAviso(a.id)}
            aria-label="Cerrar aviso"
            className="-my-1 -mr-2 px-2 py-1 font-bold opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
