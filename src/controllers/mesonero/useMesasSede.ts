import { usePowerSyncWatch } from '../usePowerSyncWatch'
import type { Usuario } from '../../models/types'

export interface MesaVista {
  id: string
  numero: string
  // sin_atender = la abrió el cliente con el QR y ningún mesonero la tomó
  estado: 'libre' | 'mia' | 'otro' | 'sin_atender' | 'por_limpiar'
  sesionId?: string
  mesoneroId?: string
  mesero?: string
  tiempoLabel?: string
}

export type MesaConPosicion = MesaVista & { posicionX: number; posicionY: number }

interface MesaRow {
  id: string
  nombre_numero: string
  posicion_x: number | null
  posicion_y: number | null
  estado: 'libre' | 'ocupada' | 'por_limpiar'
}

interface SesionRow {
  id: string
  mesa_id: string
  mesonero_id: string | null
  abierta_en: string
}

interface UsuarioRow {
  id: string
  nombre: string
}

function etiquetaTiempo(abiertaEnIso: string) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(abiertaEnIso).getTime()) / 60000))
  return `${minutos} min`
}

// Las mesas de la sede del mesonero, vistas desde él: suya, de otro
// mesonero, libre, por limpiar o abierta por QR sin atender. Lectura
// reactiva de la SQLite local (PowerSync), así que funciona sin internet.
// La usan el mapa de mesas y el selector de mesa del pedido.
export function useMesasSede(usuario: Usuario): MesaConPosicion[] {
  const mesasRaw = usePowerSyncWatch<MesaRow>('select * from mesas where sede_id = ?', [usuario.sede_id])
  const sesiones = usePowerSyncWatch<SesionRow>(
    "select * from sesiones_mesa where sede_id = ? and estado = 'abierta'",
    [usuario.sede_id],
  )
  const usuariosSede = usePowerSyncWatch<UsuarioRow>('select id, nombre from usuarios where tenant_id = ?', [
    usuario.tenant_id,
  ])

  return mesasRaw.map((mesa) => {
    const sesion = sesiones.find((s) => s.mesa_id === mesa.id)

    // Una sesión abierta manda sobre mesas.estado: el cliente puede abrir
    // la mesa por QR aunque siga marcada "por limpiar" (0004 solo la pasa a
    // ocupada si estaba libre).
    let estado: MesaVista['estado']
    if (sesion) {
      if (sesion.mesonero_id === null) estado = 'sin_atender'
      else estado = sesion.mesonero_id === usuario.id ? 'mia' : 'otro'
    } else if (mesa.estado === 'por_limpiar') estado = 'por_limpiar'
    else if (mesa.estado === 'libre') estado = 'libre'
    else estado = 'otro'

    return {
      id: mesa.id,
      numero: mesa.nombre_numero,
      estado,
      sesionId: sesion?.id,
      mesoneroId: sesion?.mesonero_id ?? undefined,
      mesero: sesion ? usuariosSede.find((u) => u.id === sesion.mesonero_id)?.nombre : undefined,
      tiempoLabel: sesion ? etiquetaTiempo(sesion.abierta_en) : undefined,
      posicionX: mesa.posicion_x ?? 50,
      posicionY: mesa.posicion_y ?? 50,
    }
  })
}

// A qué mesas se le puede mandar un pedido: las propias, las libres (se
// abren al enviar) y las abiertas por QR sin atender (se atienden al
// enviar). Las de otro mesonero o por limpiar no: igual que en el mapa.
export function aceptaPedido(mesa: MesaVista) {
  return mesa.estado === 'mia' || mesa.estado === 'libre' || mesa.estado === 'sin_atender'
}
