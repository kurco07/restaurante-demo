import { useMemo, useState } from 'react'
import { useUsuario } from '../usuario/useUsuario'
import { usePowerSyncWatch } from '../usePowerSyncWatch'
import { enviarPedidoACocina } from '../../models/services/pedidoService'
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
}

export const CATEGORIA_FAVORITOS = 'favoritos'

export function usePedidos(mesaId: string) {
  const { usuario } = useUsuario()

  const mesaRows = usePowerSyncWatch<MesaRow>('select id, nombre_numero from mesas where id = ?', [mesaId])
  const mesa = mesaRows[0] as MesaRow | undefined

  const sesionRows = usePowerSyncWatch<SesionRow>(
    "select id, mesa_id from sesiones_mesa where mesa_id = ? and estado = 'abierta' order by abierta_en desc limit 1",
    [mesaId],
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
    `select pi.id, pi.menu_item_id, pi.cantidad, pi.precio_unitario, pi.notas, pi.estado, mi.nombre
       from pedidos_items pi
       left join menu_items mi on mi.id = pi.menu_item_id
      where pi.sesion_id = ?
      order by pi.creado_en`,
    [sesion?.id ?? ''],
  )

  const [categoriaActiva, setCategoriaActiva] = useState<string>(CATEGORIA_FAVORITOS)
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
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
    () => itemsEnviados.map((item) => ({ ...item, nombre: item.nombre ?? 'Plato' })),
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

    setCarrito((prev) => [...prev, nuevoItem])
    cerrarModal()
  }

  const actualizarCantidadCarrito = (id: string, delta: number) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nuevaCant = Math.max(1, item.cantidad + delta)
        return { ...item, cantidad: nuevaCant, precioTotal: item.precioBase * nuevaCant }
      }),
    )
  }

  const eliminarDelCarrito = (id: string) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id))
  }

  const calcularSubtotal = (): number => carrito.reduce((sum, item) => sum + item.precioTotal, 0)

  async function enviarACocina() {
    if (!usuario?.sede_id || !sesion || carrito.length === 0) return
    setEnviando(true)
    try {
      await enviarPedidoACocina(
        { tenant_id: usuario.tenant_id, sede_id: usuario.sede_id, sesion_id: sesion.id, agregadoPor: usuario.id },
        carrito,
      )
      setCarrito([])
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
    calcularSubtotal,
    enviarACocina,
  }
}
