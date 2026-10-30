import { useCallback, useEffect, useRef, useState } from 'react'
import type { PedidoCompartidoMesa } from '../../models/types'
import { fetchPedidoCompartidoMesa } from '../../models/services/menuPublicoService'
import { claves, guardarLocal, leerLocal } from './guardadoLocal'

// Cada cuánto el celular del cliente vuelve a leer el pedido de la mesa.
// El cliente no tiene sesión, así que no puede suscribirse a Realtime de
// pedidos_items (RLS lo bloquea, a propósito): se consulta la función
// pública pedido_publico_mesa cada pocos segundos mientras la pestaña
// está visible. El mesonero ve lo mismo al instante vía PowerSync.
const INTERVALO_MS = 5000

// Pedido compartido de la mesa (Fase 3, Módulo 3): lo que cargó el
// mesonero y lo que pidió el cliente, con su estado de cocina.
// Lo último que se vio queda guardado en el celular (Fase 8, Módulo 1):
// recargar sin internet sigue mostrando lo ya pedido en la mesa.
export function usePedidoCompartido(mesaId: string | null) {
  const [pedido, setPedido] = useState<PedidoCompartidoMesa | null>(() =>
    mesaId ? leerLocal<PedidoCompartidoMesa>(claves.pedidoMesa(mesaId)) : null,
  )
  const [sinConexion, setSinConexion] = useState(false)
  // La mesa tuvo una sesión abierta mientras el cliente miraba y ahora no:
  // el mesonero cerró la cuenta.
  const [cuentaCerrada, setCuentaCerrada] = useState(false)
  const habiaSesion = useRef(false)

  const refrescar = useCallback(async () => {
    if (!mesaId) return
    try {
      const datos = await fetchPedidoCompartidoMesa(mesaId)
      setSinConexion(false)
      if (!datos) return
      if (datos.sesion_abierta) {
        habiaSesion.current = true
        setCuentaCerrada(false)
      } else if (habiaSesion.current) {
        setCuentaCerrada(true)
      }
      setPedido(datos)
      guardarLocal(claves.pedidoMesa(mesaId), datos)
    } catch {
      // Se conserva el último pedido conocido; solo se avisa.
      setSinConexion(true)
    }
  }, [mesaId])

  useEffect(() => {
    if (!mesaId) return
    void refrescar()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void refrescar()
    }, INTERVALO_MS)
    const alVolver = () => {
      if (document.visibilityState === 'visible') void refrescar()
    }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('online', alVolver)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('online', alVolver)
    }
  }, [mesaId, refrescar])

  const items = pedido?.items ?? []

  return {
    items,
    total: items.reduce((s, i) => s + Number(i.precio_unitario) * i.cantidad, 0),
    sinConexion,
    cuentaCerrada,
    refrescar,
  }
}
