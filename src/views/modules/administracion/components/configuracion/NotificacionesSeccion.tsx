import type { PreferenciaNotificacion } from '../../../../../models/types'
import { Switch } from '../comunes'
import { SeccionConfig } from './SeccionConfig'

interface NotificacionesSeccionProps {
  notificaciones: PreferenciaNotificacion[]
  activas: Set<string>
  onAlternar: (id: string) => void
}

export function NotificacionesSeccion({ notificaciones, activas, onAlternar }: NotificacionesSeccionProps) {
  return (
    <SeccionConfig titulo="Notificaciones" subtitulo="Qué alertas quieres recibir como administradora">
      <div className="divide-y divide-[var(--border)]">
        {notificaciones.map((n) => (
          <div key={n.id} className="flex items-center justify-between py-2.5 first:pt-0.5">
            <span className="text-[13px] font-semibold">{n.label}</span>
            <Switch encendido={activas.has(n.id)} onCambiar={() => onAlternar(n.id)} label={n.label} />
          </div>
        ))}
      </div>
    </SeccionConfig>
  )
}
