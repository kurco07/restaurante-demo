// ============================================================
// Fase 7, Módulo 6 — Activar/desactivar, eliminar y resetear contraseña
// ============================================================
// Misma convención que crear-empleado: anon key + JWT del que llama para
// derivar su propio tenant_id/rol por RLS, clave de servicio solo para
// lo que RLS no puede hacer (bloquear el login de verdad, borrar la
// cuenta de Auth, cambiar la contraseña). El usuario objetivo se valida
// contra el tenant del que llama leyéndolo con SU sesión (RLS), nunca
// confiando el tenant_id del body — y nadie puede actuar sobre su propia
// cuenta.
//
// Desactivar banea al usuario en Supabase Auth (bloquea login/renovar
// token de verdad, no es solo una bandera decorativa). No corta una
// sesión de mesa ya abierta ni un dispositivo que siga offline — no hay
// forma limpia de "desconectar" algo que ya está autenticado localmente;
// solo impide que vuelva a entrar.
//
// resetear_contrasena (2026-11-14): administración siempre controla la
// contraseña del empleado — el empleado nunca la cambia él mismo.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { autenticar, CORS, responder } from '../_shared/http.ts'

// ~100 años — efectivamente permanente hasta que se reactive.
const BAN_PERMANENTE = '876000h'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const sesion = await autenticar(req, ['administracion', 'gerencia'])
  if (sesion instanceof Response) return sesion
  const { supabase, perfil } = sesion

  const body = await req.json().catch(() => null)
  const usuarioId = typeof body?.usuario_id === 'string' ? body.usuario_id : ''
  const accion = typeof body?.accion === 'string' ? body.accion : ''
  const nuevaContrasena = typeof body?.nueva_contrasena === 'string' ? body.nueva_contrasena : ''

  if (!usuarioId || !['activar', 'desactivar', 'eliminar', 'resetear_contrasena'].includes(accion)) {
    return responder({ ok: false, mensaje: 'Faltan datos o la acción no es válida.' }, 400)
  }
  if (accion === 'resetear_contrasena' && nuevaContrasena.length < 6) {
    return responder({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres.' }, 400)
  }
  if (usuarioId === perfil.id) {
    return responder({ ok: false, mensaje: 'No puedes hacerte esto a ti mismo.' }, 400)
  }

  // El objetivo tiene que ser del mismo tenant de quien llama — se
  // verifica con la sesión del propio caller (RLS), igual que crear-empleado.
  const { data: objetivo } = await supabase.from('usuarios').select('id').eq('id', usuarioId).maybeSingle()
  if (!objetivo) return responder({ ok: false, mensaje: 'Ese empleado no pertenece a tu restaurante.' }, 403)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  if (accion === 'eliminar') {
    const { error } = await admin.auth.admin.deleteUser(usuarioId)
    if (error) {
      console.error(error)
      return responder({ ok: false, mensaje: 'No se pudo eliminar el empleado.' }, 500)
    }
    return responder({ ok: true })
  }

  if (accion === 'resetear_contrasena') {
    const { error } = await admin.auth.admin.updateUserById(usuarioId, { password: nuevaContrasena })
    if (error) {
      console.error(error)
      return responder({ ok: false, mensaje: 'No se pudo cambiar la contraseña.' }, 500)
    }
    return responder({ ok: true })
  }

  const activo = accion === 'activar'
  const { error: errorBan } = await admin.auth.admin.updateUserById(usuarioId, {
    ban_duration: activo ? 'none' : BAN_PERMANENTE,
  })
  if (errorBan) {
    console.error(errorBan)
    return responder({ ok: false, mensaje: 'No se pudo cambiar el acceso del empleado.' }, 500)
  }

  const { error: errorUsuario } = await admin.from('usuarios').update({ activo }).eq('id', usuarioId)
  if (errorUsuario) {
    console.error(errorUsuario)
    return responder({ ok: false, mensaje: 'Se cambió el acceso pero no se pudo actualizar el registro.' }, 500)
  }

  return responder({ ok: true })
})
