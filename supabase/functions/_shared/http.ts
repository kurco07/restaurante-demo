import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

// Utilidades comunes de las Edge Functions de IA (Fase 6).

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

export interface Perfil {
  id: string
  tenant_id: string
  sede_id: string | null
  rol: string
}

// Identifica a quien llama con SU sesión (el token que manda la app) y
// devuelve un cliente de Supabase que actúa como esa persona: todo lo que
// lea o escriba pasa por RLS, igual que desde la app. No se usa la clave
// de servicio, así una función de IA nunca puede ver otro restaurante.
export async function autenticar(
  req: Request,
  rolesPermitidos: string[],
): Promise<{ supabase: SupabaseClient; perfil: Perfil } | Response> {
  const authorization = req.headers.get('Authorization')
  if (!authorization) return responder({ ok: false, mensaje: 'Falta la sesión.' }, 401)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })

  const { data: usuario } = await supabase.auth.getUser()
  if (!usuario.user) return responder({ ok: false, mensaje: 'Sesión inválida o vencida.' }, 401)

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, tenant_id, sede_id, rol')
    .eq('id', usuario.user.id)
    .single()
  if (!perfil) return responder({ ok: false, mensaje: 'No se encontró tu perfil.' }, 403)
  if (!rolesPermitidos.includes(perfil.rol)) {
    return responder({ ok: false, mensaje: 'Tu rol no tiene acceso a esta función.' }, 403)
  }

  return { supabase, perfil: perfil as Perfil }
}

// Los secretos de Supabase que usa la capa de IA (ver _shared/ia/index.ts)
export function configIA() {
  return {
    IA_PROVEEDOR: Deno.env.get('IA_PROVEEDOR'),
    GEMINI_API_KEY: Deno.env.get('GEMINI_API_KEY'),
    GEMINI_MODELO: Deno.env.get('GEMINI_MODELO'),
  }
}
