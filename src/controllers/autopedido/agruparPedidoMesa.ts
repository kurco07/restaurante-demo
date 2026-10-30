import type { EstadoItemPedido, ItemPedidoCompartido } from '../../models/types'

export interface LineaPedidoMesa {
  clave: string
  nombre: string
  cantidad: number
  precio_unitario: number
  notas: string | null
  estado: EstadoItemPedido
  // Quién lo pidió: solo por QR, solo con el mesonero, o los dos
  origen: 'qr' | 'mesonero' | 'ambos'
}

// "Ya pedido en la mesa" del cliente (Fase 8, Módulo 1): si dos personas de
// la mesa piden lo mismo, se ve una sola línea "2× Burger" en vez de dos.
// Solo se juntan los que son de verdad iguales: mismo plato, misma nota,
// mismo precio y mismo estado de cocina (uno listo y otro en preparación
// siguen en líneas distintas).
export function agruparPedidoMesa(items: ItemPedidoCompartido[]): LineaPedidoMesa[] {
  const lineas = new Map<string, LineaPedidoMesa>()
  for (const i of items) {
    const clave = [i.nombre, i.notas ?? '', Number(i.precio_unitario), i.estado].join('|')
    const origen = i.por_qr ? 'qr' : 'mesonero'
    const existente = lineas.get(clave)
    if (existente) {
      existente.cantidad += i.cantidad
      if (existente.origen !== origen) existente.origen = 'ambos'
    } else {
      lineas.set(clave, {
        clave,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precio_unitario: Number(i.precio_unitario),
        notas: i.notas,
        estado: i.estado,
        origen,
      })
    }
  }
  return [...lineas.values()]
}
