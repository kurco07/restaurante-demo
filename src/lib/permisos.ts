import type { Rol } from '../models/types'

// Capacidades del supervisor de sala por encima del mesonero (Fase 2,
// Módulo 7; arquitectura.md §4.10): anular un plato ya enviado a cocina y
// transferir una mesa. Gerencia las tiene también ("todo lo anterior").
// Es solo para mostrar u ocultar botones: la barrera real son los
// triggers de la migración 0015.
export function puedeSupervisar(rol: Rol) {
  return rol === 'supervisor' || rol === 'gerencia'
}
