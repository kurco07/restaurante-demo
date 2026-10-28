// ============================================================
// Fase 7, Módulos 1 y 2 — Registro self-service + aprovisionamiento
// automático del tenant
// ============================================================
// Pública (sin JWT, verify_jwt=false en config.toml): quien llama todavía
// no existe como usuario. Primero crea el usuario de Auth con la clave de
// servicio, después aprovisiona tenant/sede/suscripción/usuario con
// provisionar_tenant (migración 0027, también solo callable con clave de
// servicio). Si el aprovisionamiento falla, borra el usuario de Auth que
// acababa de crear — nunca debe quedar un usuario sin tenant.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { CORS, responder } from '../_shared/http.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const body = await req.json().catch(() => null)
  const nombreRestaurante = typeof body?.nombre_restaurante === 'string' ? body.nombre_restaurante.trim() : ''
  const nombreUsuario = typeof body?.nombre_usuario === 'string' ? body.nombre_usuario.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const telefono = typeof body?.telefono === 'string' && body.telefono.trim() ? body.telefono.trim() : null

  if (!nombreRestaurante || !nombreUsuario || !email || password.length < 8) {
    return responder({ ok: false, mensaje: 'Revisa los datos: todos son obligatorios y la contraseña necesita al menos 8 caracteres.' }, 400)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  const { data: creado, error: errorCrear } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (errorCrear || !creado.user) {
    const yaExiste = errorCrear?.message?.toLowerCase().includes('already')
    return responder(
      { ok: false, mensaje: yaExiste ? 'Ya existe una cuenta con ese correo.' : 'No se pudo crear la cuenta.' },
      400,
    )
  }

  const { error: errorProvision } = await admin.rpc('provisionar_tenant', {
    p_auth_user_id: creado.user.id,
    p_nombre_restaurante: nombreRestaurante,
    p_nombre_usuario: nombreUsuario,
    p_telefono: telefono,
  })
  if (errorProvision) {
    console.error(errorProvision)
    await admin.auth.admin.deleteUser(creado.user.id)
    return responder({ ok: false, mensaje: 'No se pudo crear tu restaurante. Intenta de nuevo.' }, 500)
  }

  return responder({ ok: true })
})
