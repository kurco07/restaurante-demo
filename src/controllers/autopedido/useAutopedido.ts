import { useCallback, useEffect, useRef, useState } from 'react'
import type { ItemCarritoAutopedido, MenuPublicoMesa, PlatoAutopedido } from '../../models/types'
import { enviarPedidoAutopedido, fetchMenuPublicoMesa } from '../../models/services/menuPublicoService'
import { usePedidoCompartido } from './usePedidoCompartido'
import { claves, esErrorDeRed, guardarLocal, leerLocal } from './guardadoLocal'
import { mensajeDeError } from '../../lib/errores'

export type VistaAutopedido = 'menu' | 'pedido'

// Primera "categoría" de las pills: muestra todos los platos.
export const TODAS = 'todas'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Cada cuánto se reintenta sin internet (cargar el menú o enviar el pedido)
const REINTENTO_MS = 15_000

type Carga =
  | { estado: 'cargando' }
  | { estado: 'no_encontrada' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'lista'; menu: MenuPublicoMesa }

// Estado de la pantalla pública de autopedido (cliente por QR). El menú se
// lee de Supabase vía menu_publico_mesa — el celular del cliente no usa
// PowerSync (no tiene sesión). enviarPedido() llama a la función segura
// enviar_pedido_autopedido (Fase 3, Módulo 2): el precio de cada ítem lo
// recalcula el servidor, nunca el que mandaría el celular. Lo ya pedido en
// la mesa viene de usePedidoCompartido (Fase 3, Módulo 3).
//
// Sin internet (Fase 8, Módulo 1):
// - El último menú de la mesa queda guardado en el celular: recargar sin
//   conexión lo muestra igual, y se vuelve a pedir solo cuando vuelve la red.
// - El carrito también queda guardado: recargar no lo borra.
// - Si se envía sin conexión, el pedido queda "por enviar" y se manda solo
//   al volver la red. Es seguro reintentar: cada plato lleva su
//   client_local_id y el servidor ignora los repetidos.
export function useAutopedido(mesaId: string | undefined) {
  const mesaValida = mesaId && UUID_RE.test(mesaId) ? mesaId : null

  const [carga, setCarga] = useState<Carga>(() => {
    if (!mesaValida) return { estado: 'no_encontrada' }
    const guardado = leerLocal<MenuPublicoMesa>(claves.menu(mesaValida))
    return guardado ? { estado: 'lista', menu: guardado } : { estado: 'cargando' }
  })
  // El menú en pantalla es la copia guardada (no se pudo confirmar con el servidor)
  const [menuSinConfirmar, setMenuSinConfirmar] = useState(() => carga.estado === 'lista')
  const [vista, setVista] = useState<VistaAutopedido>('menu')
  const [categoria, setCategoria] = useState(TODAS)
  const [carrito, setCarrito] = useState<ItemCarritoAutopedido[]>(() =>
    mesaValida ? (leerLocal<ItemCarritoAutopedido[]>(claves.carrito(mesaValida)) ?? []) : [],
  )

  const [platoAbierto, setPlatoAbierto] = useState<PlatoAutopedido | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [nota, setNota] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)
  // Se intentó enviar sin internet: se manda solo al volver la conexión
  const [envioPendiente, setEnvioPendiente] = useState(() =>
    mesaValida ? leerLocal<boolean>(claves.envioPendiente(mesaValida)) === true : false,
  )

  // El carrito y el envío pendiente se guardan en cada cambio
  useEffect(() => {
    if (mesaValida) guardarLocal(claves.carrito(mesaValida), carrito.length ? carrito : null)
  }, [mesaValida, carrito])
  useEffect(() => {
    if (mesaValida) guardarLocal(claves.envioPendiente(mesaValida), envioPendiente || null)
  }, [mesaValida, envioPendiente])

  // Cargar el menú; sin red se queda con la copia guardada y reintenta
  const cargarMenu = useCallback(async () => {
    if (!mesaValida) return
    try {
      const menu = await fetchMenuPublicoMesa(mesaValida)
      if (menu) {
        guardarLocal(claves.menu(mesaValida), menu)
        setCarga({ estado: 'lista', menu })
      } else {
        guardarLocal(claves.menu(mesaValida), null)
        setCarga({ estado: 'no_encontrada' })
      }
      setMenuSinConfirmar(false)
    } catch (e) {
      setCarga((actual) =>
        actual.estado === 'lista' ? actual : { estado: 'error', mensaje: mensajeDeError(e) },
      )
      setMenuSinConfirmar(true)
    }
  }, [mesaValida])

  useEffect(() => {
    void cargarMenu()
  }, [cargarMenu])

  const menu = carga.estado === 'lista' ? carga.menu : null
  // Solo se consulta el pedido de una mesa que ya se validó con el menú.
  const compartido = usePedidoCompartido(menu && mesaValida ? mesaValida : null)
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

  // Lo usa el envío automático: siempre el carrito más reciente
  const carritoRef = useRef(carrito)
  carritoRef.current = carrito

  const enviarPedido = useCallback(async () => {
    const aEnviar = carritoRef.current
    if (!mesaValida || aEnviar.length === 0) return
    setEnviando(true)
    setErrorEnvio(null)
    try {
      await enviarPedidoAutopedido(mesaValida, aEnviar)
      // Solo se quitan del carrito los que se mandaron (pudo agregar más mientras tanto)
      const enviados = new Set(aEnviar.map((i) => i.id))
      setCarrito((prev) => prev.filter((i) => !enviados.has(i.id)))
      setEnvioPendiente(false)
      setPedidoEnviado(true)
      void compartido.refrescar()
    } catch (e) {
      if (esErrorDeRed(e)) {
        setEnvioPendiente(true)
      } else {
        setEnvioPendiente(false)
        setErrorEnvio(mensajeDeError(e, 'No se pudo enviar el pedido. Intenta de nuevo.'))
      }
    } finally {
      setEnviando(false)
    }
    // compartido.refrescar es estable (useCallback en usePedidoCompartido)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesaValida])

  // Sin red: reintentar al volver la conexión y cada pocos segundos, tanto
  // el menú (si no se pudo confirmar) como un envío pendiente
  useEffect(() => {
    if (!menuSinConfirmar && !envioPendiente) return
    const reintentar = () => {
      if (menuSinConfirmar) void cargarMenu()
      if (envioPendiente) void enviarPedido()
    }
    window.addEventListener('online', reintentar)
    const intervalo = setInterval(reintentar, REINTENTO_MS)
    return () => {
      window.removeEventListener('online', reintentar)
      clearInterval(intervalo)
    }
  }, [menuSinConfirmar, envioPendiente, cargarMenu, enviarPedido])

  return {
    carga,
    menu,
    // El menú se ve desde la copia guardada en el celular (sin conexión)
    menuSinConfirmar,
    vista,
    setVista,
    categoria,
    setCategoria,
    platosVisibles,
    compartido,
    carrito,
    quitarDelCarrito: (id: string) => setCarrito((prev) => prev.filter((i) => i.id !== id)),
    totalCarrito: carrito.reduce((s, i) => s + i.plato.precio * i.cantidad, 0),
    enviarPedido,
    enviando,
    errorEnvio,
    envioPendiente,
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
