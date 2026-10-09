import { useEffect, useState } from 'react'
import type { ItemCarritoAutopedido, MenuPublicoMesa, PlatoAutopedido } from '../../models/types'
import { enviarPedidoAutopedido, fetchMenuPublicoMesa } from '../../models/services/menuPublicoService'

export type VistaAutopedido = 'menu' | 'pedido'

// Primera "categoría" de las pills: muestra todos los platos.
export const TODAS = 'todas'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Carga =
  | { estado: 'cargando' }
  | { estado: 'no_encontrada' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'lista'; menu: MenuPublicoMesa }

// Estado de la pantalla pública de autopedido (cliente por QR). El menú se
// lee en vivo de Supabase vía menu_publico_mesa — el celular del cliente
// no usa PowerSync (no tiene sesión), así que esta vista sí necesita red.
// El carrito vive en memoria hasta enviarlo: enviarPedido() llama a la
// función segura enviar_pedido_autopedido (Fase 3, Módulo 2) — el precio
// de cada ítem lo recalcula el servidor, nunca el que mandaría el celular.
export function useAutopedido(mesaId: string | undefined) {
  const [carga, setCarga] = useState<Carga>({ estado: 'cargando' })
  const [vista, setVista] = useState<VistaAutopedido>('menu')
  const [categoria, setCategoria] = useState(TODAS)
  const [carrito, setCarrito] = useState<ItemCarritoAutopedido[]>([])

  const [platoAbierto, setPlatoAbierto] = useState<PlatoAutopedido | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [nota, setNota] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  useEffect(() => {
    if (!mesaId || !UUID_RE.test(mesaId)) {
      setCarga({ estado: 'no_encontrada' })
      return
    }
    let cancelado = false
    setCarga({ estado: 'cargando' })
    fetchMenuPublicoMesa(mesaId)
      .then((menu) => {
        if (cancelado) return
        setCarga(menu ? { estado: 'lista', menu } : { estado: 'no_encontrada' })
      })
      .catch((e: unknown) => {
        if (cancelado) return
        setCarga({ estado: 'error', mensaje: e instanceof Error ? e.message : String(e) })
      })
    return () => {
      cancelado = true
    }
  }, [mesaId])

  const menu = carga.estado === 'lista' ? carga.menu : null
  const platosVisibles = !menu
    ? []
    : categoria === TODAS
      ? menu.platos
      : menu.platos.filter((p) => p.categoria_id === categoria)

  function abrirPlato(plato: PlatoAutopedido) {
    setPlatoAbierto(plato)
    setCantidad(1)
    setNota('')
  }

  function agregarAlCarrito() {
    if (!platoAbierto) return
    setCarrito((prev) => [...prev, { id: crypto.randomUUID(), plato: platoAbierto, cantidad, nota: nota.trim() }])
    setPlatoAbierto(null)
  }

  async function enviarPedido() {
    if (!mesaId || carrito.length === 0) return
    setEnviando(true)
    setErrorEnvio(null)
    try {
      await enviarPedidoAutopedido(mesaId, carrito)
      setCarrito([])
      setPedidoEnviado(true)
    } catch (e) {
      setErrorEnvio(e instanceof Error ? e.message : 'No se pudo enviar el pedido. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return {
    carga,
    menu,
    vista,
    setVista,
    categoria,
    setCategoria,
    platosVisibles,
    carrito,
    quitarDelCarrito: (id: string) => setCarrito((prev) => prev.filter((i) => i.id !== id)),
    totalCarrito: carrito.reduce((s, i) => s + i.plato.precio * i.cantidad, 0),
    enviarPedido,
    enviando,
    errorEnvio,
    pedidoEnviado,
    nuevoPedido: () => {
      setPedidoEnviado(false)
      setVista('menu')
    },
    personalizacion: {
      plato: platoAbierto,
      abrir: abrirPlato,
      cerrar: () => setPlatoAbierto(null),
      cantidad,
      cambiarCantidad: (delta: number) => setCantidad((c) => Math.max(1, c + delta)),
      nota,
      setNota,
      precio: platoAbierto ? platoAbierto.precio * cantidad : 0,
      agregar: agregarAlCarrito,
    },
  }
}
