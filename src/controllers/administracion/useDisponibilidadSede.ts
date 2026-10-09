import { useEffect, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { fetchMenuItemSede, guardarMenuItemSede } from '../../models/services/menuService'

// Disponibilidad y precio de un plato en la sede del usuario de
// administración (menu_item_sede). Lo leen el menú del mesonero
// (usePedidos.ts) y el menú público del cliente (migración 0003).
export function useDisponibilidadSede(menuItemId: string) {
  const { usuario } = useUsuario()
  const [cargando, setCargando] = useState(true)
  const [disponible, setDisponible] = useState(true)
  const [precioSede, setPrecioSede] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    if (!usuario?.sede_id) return
    let cancelado = false
    fetchMenuItemSede(menuItemId, usuario.sede_id)
      .then((fila) => {
        if (cancelado) return
        setDisponible(fila?.disponible ?? true)
        setPrecioSede(fila?.precio_override != null ? String(fila.precio_override) : '')
      })
      .catch((e: unknown) => {
        if (!cancelado) setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : String(e) })
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [menuItemId, usuario?.sede_id])

  async function guardar() {
    if (!usuario?.sede_id) return
    setGuardando(true)
    setMensaje(null)
    try {
      await guardarMenuItemSede({
        tenant_id: usuario.tenant_id,
        menu_item_id: menuItemId,
        sede_id: usuario.sede_id,
        disponible,
        precio_override: precioSede.trim() === '' ? null : Number(precioSede),
      })
      setMensaje({ tipo: 'ok', texto: 'Guardado.' })
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : String(e) })
    } finally {
      setGuardando(false)
    }
  }

  return {
    sinSede: !usuario?.sede_id,
    cargando,
    disponible,
    setDisponible,
    precioSede,
    setPrecioSede,
    guardando,
    mensaje,
    guardar,
  }
}
