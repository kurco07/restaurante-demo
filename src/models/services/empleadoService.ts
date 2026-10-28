import { supabase } from '../../lib/supabaseClient'

export type RolEmpleadoCreable = 'mesonero' | 'cocina' | 'supervisor'

interface ResultadoCrearEmpleado {
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
  const { data, error } = await supabase.functions.invoke<ResultadoCrearEmpleado>('crear-empleado', {
    body: { nombre: datos.nombre, email: datos.email, rol: datos.rol, sede_id: datos.sedeId },
  })
  if (error || !data?.ok) throw new Error(data?.mensaje ?? 'No se pudo crear el empleado.')
  return data
}
