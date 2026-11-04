import { useState } from 'react'
import type { SedeConfig } from '../../../../../models/types'
import { Switch } from '../comunes'
import { SeccionConfig } from './SeccionConfig'

interface NotificacionesSeccionProps {
  sede: SedeConfig
  onGuardar: (cambios: Partial<SedeConfig>) => Promise<void>
}

type ClavePreferencia = 'notif_stock_bajo' | 'notif_pedidos_demorados' | 'notif_resumen_diario'

const PREFERENCIAS: { clave: ClavePreferencia; label: string }[] = [
  { clave: 'notif_stock_bajo', label: 'Alertas de stock bajo' },
  { clave: 'notif_pedidos_demorados', label: 'Alertas de pedidos demorados' },
  { clave: 'notif_resumen_diario', label: 'Resumen diario por correo' },
]

// Solo guarda la preferencia (migración 0034) — todavía no existe ningún
// sistema de envío real (ni correo ni push), así que prender esto no
// manda nada por ahora. Queda listo para cuando se construya el envío.
export function NotificacionesSeccion({ sede, onGuardar }: NotificacionesSeccionProps) {
  const [guardando, setGuardando] = useState<ClavePreferencia | null>(null)

  async function alternar(clave: ClavePreferencia) {
    setGuardando(clave)
    try {
      await onGuardar({ [clave]: !sede[clave] })
    } finally {
      setGuardando(null)
    }
  }

  return (
    <SeccionConfig titulo="Notificaciones" subtitulo="Qué alertas quieres recibir como administración (todavía sin envío real por correo)">
      <div className="divide-y divide-[var(--border)]">
        {PREFERENCIAS.map((p) => (
          <div key={p.clave} className="flex items-center justify-between py-2.5 first:pt-0.5">
            <span className="text-[13px] font-semibold">{p.label}</span>
            <Switch encendido={sede[p.clave]} onCambiar={guardando ? undefined : () => alternar(p.clave)} label={p.label} />
          </div>
        ))}
      </div>
    </SeccionConfig>
  )
}
