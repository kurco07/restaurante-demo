// ============================================================
// Fase 7, Módulo 6 — Gestión de usuarios y roles
// ============================================================
// administración/gerencia crea cuentas de mesonero/cocina/supervisor
// dentro de SU PROPIO tenant. A diferencia de las funciones de IA, acá
// sí hace falta la clave de servicio (crear un usuario de Auth no se
// puede hacer con RLS) — pero el tenant_id nunca sale del body que manda
// el cliente: se deriva siempre de la sesión real de quien llama, leída
// con su propio JWT a través de RLS (igual que las funciones de IA), así
// que no hay forma de inyectar un tenant_id ajeno.
//
// Se invita por correo (inviteUserByEmail) en vez de que el admin ponga
// una contraseña a mano: el empleado la define al abrir el link, nadie
// más la conoce.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { autenticar, CORS, responder } from '../_shared/http.ts'

const ROLES_QUE_PUEDE_CREAR = ['mesonero', 'cocina', 'supervisor']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const sesion = await autenticar(req, ['administracion', 'gerencia'])
  if (sesion instanceof Response) return sesion
  const { supabase, perfil } = sesion

  const body = await req.json().catch(() => null)
  const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const rol = typeof body?.rol === 'string' ? body.rol : ''
  const sedeId = typeof body?.sede_id === 'string' ? body.sede_id : null

  if (!nombre || !email || !ROLES_QUE_PUEDE_CREAR.includes(rol)) {
    return responder({ ok: false, mensaje: 'Faltan datos o el rol no es válido.' }, 400)
  }

  // La sede pedida tiene que ser del mismo tenant de quien llama — se
  // verifica con la sesión del propio caller (RLS), nunca confiando en
  // el body a secas.
  if (sedeId) {
    const { data: sede } = await supabase.from('sedes').select('id').eq('id', sedeId).maybeSingle()
    if (!sede) return responder({ ok: false, mensaje: 'Esa sede no pertenece a tu restaurante.' }, 403)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  const { data: invitado, error: errorInvitar } = await admin.auth.admin.inviteUserByEmail(email)
  if (errorInvitar || !invitado.user) {
    console.error(errorInvitar)
    return responder({ ok: false, mensaje: 'No se pudo invitar a ese correo (¿ya tiene cuenta?).' }, 400)
  }

  const { error: errorUsuario } = await admin.from('usuarios').insert({
    id: invitado.user.id,
    tenant_id: perfil.tenant_id,
    sede_id: sedeId,
    nombre,
    rol,
  })
  if (errorUsuario) {
    console.error(errorUsuario)
    await admin.auth.admin.deleteUser(invitado.user.id)
    return responder({ ok: false, mensaje: 'No se pudo crear el perfil del empleado.' }, 500)
  }

  return responder({ ok: true, usuarioId: invitado.user.id })
})
