import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../auth/useAuth'
import { fetchMenuItems } from '../../models/services/menuService'
import { fetchRecetaPorMenuItem } from '../../models/services/menuService'
import type { MenuItem } from '../../models/types'
import type { PlatoConExtras, ItemCarrito } from '../../models/types'
import { crearPedidosPrueba } from './mockData/pedidos'

interface UsePedidosReturn {
  platos: PlatoConExtras[]
  platosFiltrados: PlatoConExtras[]
  categoriaActiva: string
  setCategoriaActiva: (cat: string) => void
  busqueda: string
  setBusqueda: (b: string) => void
  carrito: ItemCarrito[]
  setCarrito: React.Dispatch<React.SetStateAction<ItemCarrito[]>>
  notaGeneral: string
  setNotaGeneral: (n: string) => void
  modalAbierto: boolean
  setModalAbierto: (open: boolean) => void
  platoModal: PlatoConExtras | null
  setPlatoModal: (p: PlatoConExtras | null) => void
  proteinaSeleccionada: string | null
  setProteinaSeleccionada: (p: string | null) => void
  ingredientesQuitados: Set<string>
  setIngredientesQuitados: React.Dispatch<React.SetStateAction<Set<string>>>
  extrasSeleccionados: Set<string>
  setExtrasSeleccionados: React.Dispatch<React.SetStateAction<Set<string>>>
  cantidad: number
  setCantidad: (c: number) => void
  notaItem: string
  setNotaItem: (n: string) => void
  loading: boolean
  filtrarPlatos: (lista: PlatoConExtras[]) => void
  abrirModal: (plato: PlatoConExtras) => void
  cerrarModal: () => void
  toggleQuitar: (ing: string) => void
  toggleExtra: (nombre: string) => void
  calcularPrecioItem: () => number
  agregarAlCarrito: () => void
  actualizarCantidadCarrito: (id: string, delta: number) => void
  eliminarDelCarrito: (id: string) => void
  calcularSubtotal: () => number
  enviarACocina: (mesaNumero: number, notaGeneral: string) => void
  guardarBorrador: (mesaNumero: number, notaGeneral: string) => void
}

export function usePedidos(): UsePedidosReturn {
  const { user } = useAuth()

  const [platos, setPlatos] = useState<PlatoConExtras[]>([])
  const [platosFiltrados, setPlatosFiltrados] = useState<PlatoConExtras[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Favoritos')
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState<ItemCarrito[]>(() => crearPedidosPrueba())
  const [notaGeneral, setNotaGeneral] = useState('Cliente celebra cumpleaños — llevar postre con vela')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [platoModal, setPlatoModal] = useState<PlatoConExtras | null>(null)
  const [proteinaSeleccionada, setProteinaSeleccionada] = useState<string | null>(null)
  const [ingredientesQuitados, setIngredientesQuitados] = useState<Set<string>>(new Set())
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<Set<string>>(new Set())
  const [cantidad, setCantidad] = useState(1)
  const [notaItem, setNotaItem] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      if (!user) return
      try {
        const tenantId = user.user_metadata?.tenant_id || ''
        const items = await fetchMenuItems(tenantId)

        const platosConExtras: PlatoConExtras[] = await Promise.all(
          items.map(async (item: MenuItem) => {
            const receta = await fetchRecetaPorMenuItem(item.id).catch(() => [])
            return {
              ...item,
              receta,
              extras: [
                { nombre: 'Tocineta extra', precio: 1.00 },
                { nombre: 'Queso extra', precio: 0.50 },
                { nombre: 'Aguacate', precio: 1.00 },
              ],
              proteina: { opciones: ['Carne de res', 'Pollo'] },
              quitar: ['Cebolla', 'Tomate', 'Queso cheddar', 'Lechuga', 'Pepinillos'],
            }
          })
        )
        setPlatos(platosConExtras)
        filtrarPlatos(platosConExtras)
      } catch (e) {
        console.error('Error cargando menú:', e)
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [user])

  const filtrarPlatos = useCallback((lista: PlatoConExtras[]) => {
    let resultado = lista
    if (categoriaActiva !== 'Favoritos') {
      resultado = resultado.filter((p) => p.categoria_id === categoriaActiva)
    }
    if (busqueda) {
      const q = busqueda.toLowerCase()
      resultado = resultado.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q)
      )
    }
    setPlatosFiltrados(resultado)
  }, [categoriaActiva, busqueda])

  useEffect(() => {
    filtrarPlatos(platos)
  }, [categoriaActiva, busqueda, platos, filtrarPlatos])

  const abrirModal = (plato: PlatoConExtras) => {
    setPlatoModal(plato)
    setProteinaSeleccionada(plato.proteina?.opciones[0] || null)
    setIngredientesQuitados(new Set())
    setExtrasSeleccionados(new Set())
    setCantidad(1)
    setNotaItem('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setPlatoModal(null)
  }

  const toggleQuitar = (ing: string) => {
    setIngredientesQuitados((prev) => {
      const next = new Set(prev)
      next.has(ing) ? next.delete(ing) : next.add(ing)
      return next
    })
  }

  const toggleExtra = (nombre: string) => {
    setExtrasSeleccionados((prev) => {
      const next = new Set(prev)
      next.has(nombre) ? next.delete(nombre) : next.add(nombre)
      return next
    })
  }

  const calcularPrecioItem = (): number => {
    if (!platoModal) return 0
    let extraCost = 0
    extrasSeleccionados.forEach((nombre) => {
      const extra = platoModal.extras.find((e) => e.nombre === nombre)
      if (extra) extraCost += extra.precio
    })
    return (platoModal.precio_base + extraCost) * cantidad
  }

  const agregarAlCarrito = () => {
    if (!platoModal) return

    const modParts: string[] = []
    if (proteinaSeleccionada && platoModal.proteina?.opciones[0] !== proteinaSeleccionada) {
      modParts.push(proteinaSeleccionada)
    }
    ingredientesQuitados.forEach((r) => modParts.push(`Sin ${r.toLowerCase()}`))
    extrasSeleccionados.forEach((e) => modParts.push(`+${e}`))
    if (notaItem.trim()) modParts.push(`Nota: ${notaItem.trim()}`)

    const nuevoItem: ItemCarrito = {
      id: crypto.randomUUID(),
      menuItemId: platoModal.id,
      nombre: platoModal.nombre,
      cantidad,
      precioBase: platoModal.precio_base,
      extras: platoModal.extras.filter((e) => extrasSeleccionados.has(e.nombre)),
      proteinaSeleccionada: proteinaSeleccionada ?? undefined,
      ingredientesQuitados: Array.from(ingredientesQuitados),
      nota: notaItem.trim(),
      precioTotal: calcularPrecioItem(),
      agregadoPor: user?.user_metadata?.nombre || user?.email || 'Mesonero',
    }

    setCarrito((prev) => [...prev, nuevoItem])
    cerrarModal()
  }

  const actualizarCantidadCarrito = (id: string, delta: number) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nuevaCant = Math.max(1, item.cantidad + delta)
        const extraCost = item.extras.reduce((sum: number, e) => sum + e.precio, 0)
        return { ...item, cantidad: nuevaCant, precioTotal: (item.precioBase + extraCost) * nuevaCant }
      })
    )
  }

  const eliminarDelCarrito = (id: string) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id))
  }

  const calcularSubtotal = (): number => {
    return carrito.reduce((sum: number, item) => sum + item.precioTotal, 0)
  }

  const enviarACocina = (mesaNumero: number, notaGeneral: string) => {
    console.log('Enviar a cocina:', { mesaNumero, items: carrito, notaGeneral })
    alert('Pedido enviado a cocina (pendiente de implementar integración real)')
  }

  const guardarBorrador = (mesaNumero: number, notaGeneral: string) => {
    console.log('Guardar borrador:', { mesaNumero, items: carrito, notaGeneral })
    alert('Borrador guardado (pendiente de implementar)')
  }

  return {
    platos,
    platosFiltrados,
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    carrito,
    setCarrito,
    notaGeneral,
    setNotaGeneral,
    modalAbierto,
    setModalAbierto,
    platoModal,
    setPlatoModal,
    proteinaSeleccionada,
    setProteinaSeleccionada,
    ingredientesQuitados,
    setIngredientesQuitados,
    extrasSeleccionados,
    setExtrasSeleccionados,
    cantidad,
    setCantidad,
    notaItem,
    setNotaItem,
    loading,
    filtrarPlatos,
    abrirModal,
    cerrarModal,
    toggleQuitar,
    toggleExtra,
    calcularPrecioItem,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarDelCarrito,
    calcularSubtotal,
    enviarACocina,
    guardarBorrador,
  }
}