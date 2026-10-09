import { supabase } from '../../lib/supabaseClient'
import type { MenuPublicoMesa } from '../types'

// Lectura pública (sin sesión) del menú de una mesa, vía la función
// security definer menu_publico_mesa (migración 0003). El cliente del QR
// nunca lee tablas directo: RLS se lo impide, a propósito.
// Devuelve null si la mesa no existe o el restaurante no está activo.
export async function fetchMenuPublicoMesa(mesaId: string) {
  const { data, error } = await supabase.rpc('menu_publico_mesa', { p_mesa_id: mesaId })
  if (error) throw error
  return data as MenuPublicoMesa | null
}
