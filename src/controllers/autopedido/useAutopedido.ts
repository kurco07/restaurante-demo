import { useState } from 'react'
import type { ItemPedidoMesa, PlatoAutopedido } from '../../models/types'
import {
  categoriasAutopedido,
  mesaEjemplo,
  nombreRestaurante,
  pedidoInicialMesa,
  platosAutopedido,
} from './mockData/autopedido'

export type VistaAutopedido = 'menu' | 'pedido'

// Estado de la pantalla de autopedido. El carrito vive solo en memoria:
// todavía no se envía nada a Supabase (eso es Fase 3, Módulo 2).
export function useAutopedido() {
  const [vista, setVista] = useState<VistaAutopedido>('menu')
  const [categoria, setCategoria] = useState(categoriasAutopedido[0])
  const [pedido, setPedido] = useState<ItemPedidoMesa[]>(pedidoInicialMesa)

  const [platoAbierto, setPlatoAbierto] = useState<PlatoAutopedido | null>(null)
  const [proteina, setProteina] = useState<string | null>(null)
  const [quitados, setQuitados] = useState<Set<string>>(new Set())
  const [extras, setExtras] = useState<Set<string>>(new Set())
  const [cantidad, setCantidad] = useState(1)
  const [nota, setNota] = useState('')

  const platosVisibles =
    categoria === categoriasAutopedido[0] ? platosAutopedido : platosAutopedido.filter((p) => p.categoria === categoria)

  function abrirPlato(plato: PlatoAutopedido) {
    setPlatoAbierto(plato)
    setProteina(plato.proteinas?.[0] ?? null)
    setQuitados(new Set())
    setExtras(new Set())
    setCantidad(1)
    setNota('')
  }

  function alternar(set: Set<string>, valor: string) {
    const siguiente = new Set(set)
    if (siguiente.has(valor)) siguiente.delete(valor)
    else siguiente.add(valor)
    return siguiente
  }

  const precioPersonalizado = platoAbierto
    ? (platoAbierto.precio +
        (platoAbierto.extras ?? []).filter((e) => extras.has(e.nombre)).reduce((s, e) => s + e.precio, 0)) *
      cantidad
    : 0

  function agregarAlPedido() {
    if (!platoAbierto) return
    const modificaciones: string[] = []
    if (proteina && proteina !== platoAbierto.proteinas?.[0]) modificaciones.push(proteina)
    quitados.forEach((q) => modificaciones.push(`Sin ${q.toLowerCase()}`))
    extras.forEach((e) => modificaciones.push(`+${e}`))
    if (nota.trim()) modificaciones.push(`Nota: ${nota.trim()}`)

    setPedido((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nombre: platoAbierto.nombre,
        cantidad,
        modificaciones,
        agregadoPor: 'Autopedido · tú',
        precioTotal: precioPersonalizado,
      },
    ])
    setPlatoAbierto(null)
  }

  return {
    nombreRestaurante,
    mesa: mesaEjemplo,
    vista,
    setVista,
    categorias: categoriasAutopedido,
    categoria,
    setCategoria,
    platosVisibles,
    pedido,
    totalPedido: pedido.reduce((s, i) => s + i.precioTotal, 0),
    personalizacion: {
      plato: platoAbierto,
      abrir: abrirPlato,
      cerrar: () => setPlatoAbierto(null),
      proteina,
      setProteina,
      quitados,
      alternarQuitado: (ing: string) => setQuitados((s) => alternar(s, ing)),
      extras,
      alternarExtra: (nombre: string) => setExtras((s) => alternar(s, nombre)),
      cantidad,
      cambiarCantidad: (delta: number) => setCantidad((c) => Math.max(1, c + delta)),
      nota,
      setNota,
      precio: precioPersonalizado,
      agregar: agregarAlPedido,
    },
  }
}
