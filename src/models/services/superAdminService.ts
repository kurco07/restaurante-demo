import { supabase } from '../../lib/supabaseClient'
import { MODULOS_OPCIONALES, type ModuloOpcional } from './modulosService'

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

// Fase 7, Módulo 5 — interruptores por restaurante (migración 0029).
// Siempre devuelve las 6 filas: si el tenant todavía no tiene ninguna
// (los de antes de este módulo), se completan como "activo" por defecto,
// igual que ya hace el backfill de la migración para los que ya existían.
export async function fetchModulosTenant(tenantId: string): Promise<Record<ModuloOpcional, boolean>> {
  const { data, error } = await supabase.from('tenant_modulos').select('modulo, activo').eq('tenant_id', tenantId)
  if (error) throw error
  const mapa = new Map((data ?? []).map((f) => [f.modulo as ModuloOpcional, f.activo as boolean]))
  const resultado = {} as Record<ModuloOpcional, boolean>
  for (const m of MODULOS_OPCIONALES) resultado[m] = mapa.get(m) ?? true
  return resultado
}

export async function fijarModuloTenant(tenantId: string, modulo: ModuloOpcional, activo: boolean) {
  const { error } = await supabase.from('tenant_modulos').upsert({ tenant_id: tenantId, modulo, activo }, { onConflict: 'tenant_id,modulo' })
  if (error) throw error
}

export async function aplicarPresetModulos(tenantId: string, plan: string) {
  const { error } = await supabase.rpc('aplicar_preset_modulos', { p_tenant_id: tenantId, p_plan: plan })
  if (error) throw error
}

export async function marcarSuscripcion(
  suscripcionId: string,
  cambios: Partial<Pick<SuscripcionTenant, 'estado' | 'proveedor_de_pago' | 'referencia_externa' | 'proximo_cobro'>>,
) {
  const { error } = await supabase.from('suscripciones').update(cambios).eq('id', suscripcionId)
  if (error) throw error
}
