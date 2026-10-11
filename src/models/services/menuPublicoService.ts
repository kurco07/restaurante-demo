import { supabase } from '../../lib/supabaseClient'
import type { ItemCarritoAutopedido, MenuPublicoMesa, PedidoCompartidoMesa } from '../types'

// Lectura pública (sin sesión) del menú de una mesa, vía la función
// security definer menu_publico_mesa (migración 0003). El cliente del QR
// nunca lee tablas directo: RLS se lo impide, a propósito.
// Devuelve null si la mesa no existe o el restaurante no está activo.
export async function fetchMenuPublicoMesa(mesaId: string) {
  const { data, error } = await supabase.rpc('menu_publico_mesa', { p_mesa_id: mesaId })
  if (error) throw error
  return data as MenuPublicoMesa | null
}

// Escritura pública (sin sesión) del pedido del cliente, vía la función
// security definer enviar_pedido_autopedido (migración 0004). El precio
// de cada ítem lo calcula el servidor — nunca se manda el precio que
// tenía cacheado el celular. client_local_id evita duplicar si el
// cliente reintenta el envío.
export async function enviarPedidoAutopedido(mesaId: string, items: ItemCarritoAutopedido[]) {
  const { error } = await supabase.rpc('enviar_pedido_autopedido', {
    p_mesa_id: mesaId,
    p_items: items.map((item) => ({
      menu_item_id: item.plato.id,
      cantidad: item.cantidad,
      notas: item.nota || null,
      client_local_id: item.id,
    })),
  })
  if (error) throw error
}

// Lectura pública (sin sesión) del pedido compartido de la mesa, vía la
// función security definer pedido_publico_mesa (migración 0006). Incluye
// lo que cargó el mesonero y lo que pidió el cliente, con su estado.
// Devuelve null si la mesa no existe o el restaurante no está activo.
export async function fetchPedidoCompartidoMesa(mesaId: string) {
  const { data, error } = await supabase.rpc('pedido_publico_mesa', { p_mesa_id: mesaId })
  if (error) throw error
  return data as PedidoCompartidoMesa | null
}
