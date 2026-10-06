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

  const platos = usePowerSyncWatch<Plato>('select * from menu_items where tenant_id = ? order by nombre', [
    usuario?.tenant_id ?? '',
  ])

  const itemsEnviados = usePowerSyncWatch<EnviadoRow>(
    'select id, menu_item_id, cantidad, precio_unitario, notas, estado from pedidos_items where sesion_id = ? order by creado_en',
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
    () =>
      itemsEnviados.map((item) => ({
        ...item,
        nombre: platos.find((p) => p.id === item.menu_item_id)?.nombre ?? 'Plato',
      })),
    [itemsEnviados, platos],
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
