import { useState } from 'react'
import {
  coloresMarca,
  datosRestaurante,
  facturacion,
  metodosPago,
  metodosPagoActivos,
  notificaciones,
  notificacionesActivas,
} from './mockData/configuracion'

function alternar(lista: Set<string>, valor: string) {
  const siguiente = new Set(lista)
  if (siguiente.has(valor)) siguiente.delete(valor)
  else siguiente.add(valor)
  return siguiente
}

// Solo estado de la vista: "Guardar cambios" todavía no persiste nada.
export function useConfiguracion() {
  const [pagosActivos, setPagosActivos] = useState(() => new Set(metodosPagoActivos))
  const [alertasActivas, setAlertasActivas] = useState(() => new Set(notificacionesActivas))

  return {
    datos: datosRestaurante,
    facturacion,
    metodosPago,
    pagosActivos,
    alternarPago: (metodo: string) => setPagosActivos((s) => alternar(s, metodo)),
    colores: coloresMarca,
    notificaciones,
    alertasActivas,
    alternarAlerta: (id: string) => setAlertasActivas((s) => alternar(s, id)),
  }
}
