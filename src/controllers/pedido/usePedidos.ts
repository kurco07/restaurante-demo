import { useMemo, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { usePowerSyncWatch } from '../usePowerSyncWatch'
import { useCarritos } from './useCarritos'
import { SIN_MESA } from './carritoContext'
import type { MesaVista } from '../mesonero/useMesasSede'
import { enviarPedidoACocina } from '../../models/services/pedidoService'
import { abrirMesa, atenderMesa } from '../../models/services/sesionMesaService'
import type { ItemCarrito, Plato } from '../../models/types'

interface MesaRow {
  id: string
  nombre_numero: string
}

interface SesionRow {
  id: string
  mesa_id: string
}

interface CategoriaRow {
  id: string
  nombre: string
  orden: number
}

interface EnviadoRow {
  id: string
  menu_item_id: string
  cantidad: number
  precio_unitario: number
  notas: string | null
  estado: string
  nombre: string | null
  agregado_por: string | null
}

export const CATEGORIA_FAVORITOS = 'favoritos'

// Menú + borrador de pedido. Sin mesaId es el flujo "menú primero": se
// anota sin mesa y se elige al enviar. El borrador vive en CarritoProvider,
// así que sobrevive a la navegación.
export function usePedidos(mesaId?: string) {
  const { usuario } = useUsuario()
  const carritos = useCarritos()
  const clave = mesaId ?? SIN_MESA
  const carrito = carritos.itemsDe(clave)

  const mesaRows = usePowerSyncWatch<MesaRow>('select id, nombre_numero from mesas where id = ?', [mesaId ?? ''])
  const mesa = mesaRows[0] as MesaRow | undefined

  const sesionRows = usePowerSyncWatch<SesionRow>(
    "select id, mesa_id from sesiones_mesa where mesa_id = ? and estado = 'abierta' order by abierta_en desc limit 1",
    [mesaId ?? ''],
  )
  const sesion = sesionRows[0] as SesionRow | undefined

  const categorias = usePowerSyncWatch<CategoriaRow>(
    'select id, nombre, orden from categorias_menu where tenant_id = ? order by orden',
    [usuario?.tenant_id ?? ''],
  )

  // La sede puede ocultar un plato o cambiarle el precio (menu_item_sede).
  // Sin fila para esta sede, el plato está disponible a precio_base. Mismo
  // criterio que el menú público del cliente (migración 0003).
  const platos = usePowerSyncWatch<Plato>(
    `select mi.id, mi.tenant_id, mi.categoria_id, mi.nombre, mi.descripcion, mi.imagen_url,
            mi.modelo_ar_glb_url, mi.modelo_ar_usdz_url,
            coalesce(mis.precio_override, mi.precio_base) as precio_base
       from menu_items mi
       left join menu_item_sede mis on mis.menu_item_id = mi.id and mis.sede_id = ?
      where mi.tenant_id = ? and coalesce(mis.disponible, 1) = 1
      order by mi.nombre`,
    [usuario?.sede_id ?? '', usuario?.tenant_id ?? ''],
  )

  const itemsEnviados = usePowerSyncWatch<EnviadoRow>(
    // El nombre sale de menu_items directo (no de `platos`), así un plato que
    // la sede marca como no disponible después de pedirlo sigue con su nombre.
    `select pi.id, pi.menu_item_id, pi.cantidad, pi.precio_unitario, pi.notas, pi.estado, mi.nombre, pi.agregado_por
       from pedidos_items pi
       left join menu_items mi on mi.id = pi.menu_item_id
      where pi.sesion_id = ?
      order by pi.creado_en`,
    [sesion?.id ?? ''],
  )

  const [categoriaActiva, setCategoriaActiva] = useState<string>(CATEGORIA_FAVORITOS)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [platoModal, setPlatoModal] = useState<Plato | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [notaItem, setNotaItem] = useState('')
  const [enviando, setEnviando] = useState(false)

  const platosFiltrados = useMemo(() => {
    let resultado = platos
    if (categoriaActiva !== CATEGORIA_FAVORITOS) {
      resultado = resultado.filter((p) => p.categoria_id === categoriaActiva)
    }
    if (busqueda) {
      const q = busqueda.toLowerCase()
      resultado = resultado.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q),
      )
    }
    return resultado
  }, [platos, categoriaActiva, busqueda])

  const itemsEnviadosConNombre = useMemo(
    // agregado_por nulo = lo pidió el cliente por QR (Fase 3, Módulo 2/3)
    () => itemsEnviados.map((item) => ({ ...item, nombre: item.nombre ?? 'Plato', porQr: item.agregado_por === null })),
    [itemsEnviados],
  )

  const abrirModal = (plato: Plato) => {
    setPlatoModal(plato)
    setCantidad(1)
    setNotaItem('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setPlatoModal(null)
  }

  const calcularPrecioItem = (): number => {
    if (!platoModal) return 0
    return platoModal.precio_base * cantidad
  }

  const agregarAlCarrito = () => {
    if (!platoModal) return

    const nuevoItem: ItemCarrito = {
      id: crypto.randomUUID(),
      menuItemId: platoModal.id,
      nombre: platoModal.nombre,
      cantidad,
      precioBase: platoModal.precio_base,
      nota: notaItem.trim(),
      precioTotal: calcularPrecioItem(),
    }

    carritos.agregar(clave, nuevoItem)
    cerrarModal()
  }

  const actualizarCantidadCarrito = (id: string, delta: number) => carritos.cambiarCantidad(clave, id, delta)

  const eliminarDelCarrito = (id: string) => carritos.quitar(clave, id)

  // "Cambiar mesa": el borrador pasa a la otra mesa sin enviarse.
  const moverBorradorA = (mesaDestinoId: string) => carritos.mover(clave, mesaDestinoId)

  const calcularSubtotal = (): number => carrito.reduce((sum, item) => sum + item.precioTotal, 0)

  // Envía el borrador a la mesa elegida, resolviendo antes su sesión:
  // la propia se usa tal cual, una libre se abre y una abierta por QR sin
  // atender se toma. Todo son escrituras locales PowerSync (offline).
  // Devuelve el id de la mesa, o null si no se pudo enviar.
  async function enviarACocina(mesa: MesaVista): Promise<string | null> {
    if (!usuario?.sede_id || carrito.length === 0) return null
    setEnviando(true)
    try {
      let sesionId = mesa.sesionId
      if (mesa.estado === 'libre') {
        sesionId = await abrirMesa({ id: mesa.id, tenant_id: usuario.tenant_id, sede_id: usuario.sede_id }, usuario.id)
      } else if (mesa.estado === 'sin_atender' && sesionId) {
        await atenderMesa(sesionId, usuario.id)
      } else if (mesa.estado !== 'mia') {
        return null
      }
      if (!sesionId) return null

      await enviarPedidoACocina(
        { tenant_id: usuario.tenant_id, sede_id: usuario.sede_id, sesion_id: sesionId, agregadoPor: usuario.id },
        carrito,
      )
      carritos.vaciar(clave)
      return mesa.id
    } finally {
      setEnviando(false)
    }
  }

  return {
    mesa,
    sesion,
    categorias,
    platosFiltrados,
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    carrito,
    itemsEnviados: itemsEnviadosConNombre,
    modalAbierto,
    platoModal,
    cantidad,
    setCantidad,
    notaItem,
    setNotaItem,
    enviando,
    abrirModal,
    cerrarModal,
    calcularPrecioItem,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarDelCarrito,
    moverBorradorA,
    calcularSubtotal,
    enviarACocina,
  }
}
