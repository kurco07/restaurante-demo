import { supabase } from '../../lib/supabaseClient'
import type { Empleado } from '../types'

export type RolEmpleadoCreable = 'mesonero' | 'cocina' | 'supervisor'

interface ResultadoAccion {
  ok: boolean
  mensaje?: string
  usuarioId?: string
}

// Crea un empleado nuevo en su propio tenant (Fase 7, Módulo 6, Edge
// Function crear-empleado) — solo administracion/gerencia puede llamarla.
// Administración pone la contraseña (decisión del dueño, 2026-11-14): el
// empleado nunca la elige ni la cambia él mismo.
export async function crearEmpleado(datos: {
  nombre: string
  email: string
  rol: RolEmpleadoCreable
  sedeId: string | null
  password: string
}) {
  const { data, error } = await supabase.functions.invoke<ResultadoAccion>('crear-empleado', {
    body: { nombre: datos.nombre, email: datos.email, rol: datos.rol, sede_id: datos.sedeId, password: datos.password },
  })
  if (error || !data?.ok) throw new Error(data?.mensaje ?? 'No se pudo crear el empleado.')
  return data
}

// Empleados de la sede propia (migración 0035: usuarios es solo lectura
// por RLS, pero abierta a todo el tenant — ya alcanza con filtrar acá).
export async function fetchEmpleados(sedeId: string): Promise<Empleado[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, contacto, email, creado_en, activo')
    .eq('sede_id', sedeId)
    .order('nombre')
  if (error) throw error
  return (data ?? []).map((u) => ({
    id: u.id,
    nombre: u.nombre,
    rol: u.rol,
    telefono: u.contacto,
    email: u.email,
    fechaIngreso: u.creado_en,
    activo: u.activo,
  }))
}

// Activar/desactivar (banea de verdad en Supabase Auth) o eliminar un
// empleado — Edge Function gestionar-empleado, clave de servicio.
export async function gestionarEmpleado(usuarioId: string, accion: 'activar' | 'desactivar' | 'eliminar') {
  const { data, error } = await supabase.functions.invoke<ResultadoAccion>('gestionar-empleado', {
    body: { usuario_id: usuarioId, accion },
  })
  if (error || !data?.ok) throw new Error(data?.mensaje ?? 'No se pudo completar la acción.')
}

// Administración pone una contraseña nueva — el empleado nunca cambia la
// suya (decisión del dueño, 2026-11-14).
export async function resetearContrasena(usuarioId: string, nuevaContrasena: string) {
  const { data, error } = await supabase.functions.invoke<ResultadoAccion>('gestionar-empleado', {
    body: { usuario_id: usuarioId, accion: 'resetear_contrasena', nueva_contrasena: nuevaContrasena },
  })
  if (error || !data?.ok) throw new Error(data?.mensaje ?? 'No se pudo cambiar la contraseña.')
}

// Enlace de acceso propio de cada empleado (migración 0046): administración
// lo copia desde la ficha del empleado y se lo manda. No es para
// administración — ese rol sigue entrando por el login normal.
export function enlaceAccesoEmpleado(usuarioId: string) {
  return `${window.location.origin}/acceso/${usuarioId}`
}

// Sin sesión a propósito (función pública, migración 0046): la pantalla
// de acceso la necesita para saber a quién saludar y con qué correo
// autenticar antes de que la persona haya iniciado sesión. Null = el
// enlace ya no sirve (empleado desactivado, borrado, o es de
// administración).
export async function infoAccesoEmpleado(usuarioId: string): Promise<{ nombre: string; email: string } | null> {
  const { data, error } = await supabase.rpc('info_acceso_empleado', { p_usuario_id: usuarioId })
  if (error) throw error
  return (data as { nombre: string; email: string } | null) ?? null
}
