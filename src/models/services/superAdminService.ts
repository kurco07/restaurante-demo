import { supabase } from '../../lib/supabaseClient'

export interface SuscripcionTenant {
  id: string
  estado: 'activa' | 'pausada' | 'cancelada'
  proveedor_de_pago: string
  referencia_externa: string | null
  proximo_cobro: string | null
  precio_acordado: number
}

export interface TenantAdmin {
  id: string
  nombre: string
  slug: string
  plan: string
  estado: string
  creado_en: string
  sedes: number
  usuarios: number
  suscripcion: SuscripcionTenant | null
}

// Fase 7, Módulo 5 — panel de super-admin. RLS (migración 0026) ya le
// deja a super_admin leer tenants/sedes/usuarios/suscripciones de
// cualquier tenant, no solo el propio.
export async function fetchTenantsAdmin(): Promise<TenantAdmin[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, nombre, slug, plan, estado, creado_en, sedes(count), usuarios(count), suscripciones(*)')
    .order('creado_en', { ascending: false })
  if (error) throw error

  return (data ?? []).map((t) => {
    const suscripciones = (t.suscripciones ?? []) as SuscripcionTenant[]
    const activa = suscripciones.find((s) => s.estado === 'activa') ?? suscripciones[0] ?? null
    return {
      id: t.id,
      nombre: t.nombre,
      slug: t.slug,
      plan: t.plan,
      estado: t.estado,
      creado_en: t.creado_en,
      sedes: (t.sedes as { count: number }[])?.[0]?.count ?? 0,
      usuarios: (t.usuarios as { count: number }[])?.[0]?.count ?? 0,
      suscripcion: activa,
    }
  })
}

export async function actualizarTenantAdmin(tenantId: string, cambios: { plan?: string; estado?: string }) {
  const { error } = await supabase.from('tenants').update(cambios).eq('id', tenantId)
  if (error) throw error
}

export async function marcarSuscripcion(
  suscripcionId: string,
  cambios: Partial<Pick<SuscripcionTenant, 'estado' | 'proveedor_de_pago' | 'referencia_externa' | 'proximo_cobro'>>,
) {
  const { error } = await supabase.from('suscripciones').update(cambios).eq('id', suscripcionId)
  if (error) throw error
}
