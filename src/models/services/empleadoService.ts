import { supabase } from '../../lib/supabaseClient'
import type { Empleado } from '../types'

export type RolEmpleadoCreable = 'mesonero' | 'cocina' | 'supervisor'

interface ResultadoAccion {
  ok: boolean
  mensaje?: string
  usuarioId?: string
}

// Invita a un empleado nuevo a su propio tenant (Fase 7, Módulo 6, Edge
// Function crear-empleado) — solo administracion/gerencia puede llamarla.
// El empleado recibe un correo para poner su propia contraseña.
export async function crearEmpleado(datos: {
  nombre: string
  email: string
  rol: RolEmpleadoCreable
  sedeId: string | null
}) {
  const { data, error } = await supabase.functions.invoke<ResultadoAccion>('crear-empleado', {
    body: { nombre: datos.nombre, email: datos.email, rol: datos.rol, sede_id: datos.sedeId },
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
