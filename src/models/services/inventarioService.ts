import { supabase } from '../../lib/supabaseClient'
import type { InventarioSede, Insumo, TipoMovimiento } from '../types'

export interface MovimientoConDetalle {
  id: string
  tipo: TipoMovimiento
  cantidad: number
  referencia: string | null
  fecha: string
  insumo: string
  unidad: string
  responsable: string
}

// insumos es el catálogo por tenant (qué existe), sin cantidad — eso vive
// en inventario_sede (cuánto hay en cada sede). Ver docs/modelo-de-datos.md.
export async function fetchInsumos(tenantId: string) {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nombre')

  if (error) throw error
  return data as Insumo[]
}

// Crear un insumo también crea su fila en inventario_sede (en 0) para la
// sede de quien lo crea — así el trigger de descuento automático
// (migración 0008) siempre tiene dónde escribir, incluso antes de
// registrar el primer lote o la primera compra.
export async function crearInsumo(insumo: {
  tenant_id: string
  sede_id: string
  nombre: string
  unidad_de_medida: string
  tipo: Insumo['tipo']
}) {
  const { data, error } = await supabase
    .from('insumos')
    .insert({
      tenant_id: insumo.tenant_id,
      nombre: insumo.nombre,
      unidad_de_medida: insumo.unidad_de_medida,
      tipo: insumo.tipo,
    })
    .select()
    .single()

  if (error) throw error
  const nuevoInsumo = data as Insumo

  const { error: errorInventario } = await supabase.from('inventario_sede').insert({
    tenant_id: insumo.tenant_id,
    sede_id: insumo.sede_id,
    insumo_id: nuevoInsumo.id,
    cantidad_actual: 0,
  })
  if (errorInventario) throw errorInventario

  return nuevoInsumo
}

export async function actualizarInsumo(
  id: string,
  cambios: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] },
) {
  const { data, error } = await supabase.from('insumos').update(cambios).eq('id', id).select().single()
  if (error) throw error
  return data as Insumo
}

// insumos.id lo referencian recetas (on delete restrict) e
// inventario_sede/lotes_insumo/movimientos_inventario (on delete
// cascade) — si está en uso en una receta, Postgres rechaza el borrado
// y se propaga el error tal cual, mismo patrón que menuService.
export async function eliminarInsumo(id: string) {
  const { error } = await supabase.from('insumos').delete().eq('id', id)
  if (error) throw error
}

export async function fetchInventarioSede(tenantId: string, sedeId: string) {
  const { data, error } = await supabase
    .from('inventario_sede')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('sede_id', sedeId)

  if (error) throw error
  return data as InventarioSede[]
}

export async function actualizarStockMinimo(inventarioSedeId: string, stockMinimo: number | null) {
  const { data, error } = await supabase
    .from('inventario_sede')
    .update({ stock_minimo: stockMinimo })
    .eq('id', inventarioSedeId)
    .select()
    .single()

  if (error) throw error
  return data as InventarioSede
}

// Recuento manual completo (ej. conteo físico) — fija el total, a
// diferencia de los movimientos de la Fase 4 Módulo 4 que suman/restan.
export async function actualizarStock(params: {
  tenantId: string
  sedeId: string
  insumoId: string
  nuevaCantidad: number
}) {
  const { data, error } = await supabase
    .from('inventario_sede')
    .upsert(
      {
        tenant_id: params.tenantId,
        sede_id: params.sedeId,
        insumo_id: params.insumoId,
        cantidad_actual: params.nuevaCantidad,
      },
      { onConflict: 'sede_id,insumo_id' },
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// Los últimos movimientos de la sede, con el nombre del insumo y de quien
// lo registró (nulo = automático: el trigger de descuento o una compra
// recibida) ya resueltos — se derivan uniendo, no hay columnas de texto
// duplicadas en movimientos_inventario.
export async function fetchMovimientos(tenantId: string, sedeId: string) {
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .select('id, tipo, cantidad, referencia, fecha, insumos(nombre, unidad_de_medida), usuarios(nombre)')
    .eq('tenant_id', tenantId)
    .eq('sede_id', sedeId)
    .order('fecha', { ascending: false })
    .limit(200)

  if (error) throw error
  return (
    data as unknown as {
      id: string
      tipo: TipoMovimiento
      cantidad: number
      referencia: string | null
      fecha: string
      insumos: { nombre: string; unidad_de_medida: string } | null
      usuarios: { nombre: string } | null
    }[]
  ).map(
    (fila): MovimientoConDetalle => ({
      id: fila.id,
      tipo: fila.tipo,
      cantidad: fila.cantidad,
      referencia: fila.referencia,
      fecha: fila.fecha,
      insumo: fila.insumos?.nombre ?? '—',
      unidad: fila.insumos?.unidad_de_medida ?? '',
      responsable: fila.usuarios?.nombre ?? 'Sistema (automático)',
    }),
  )
}

// Ajuste manual: 'merma' siempre resta (producto perdido/vencido/dañado),
// 'ajuste' siempre suma (corrección de un conteo físico que encontró más
// de lo registrado). No se permite una merma mayor al stock disponible —
// se valida también en la UI, pero esta es la última barrera real.
export async function registrarAjusteManual(datos: {
  tenant_id: string
  sede_id: string
  insumo_id: string
  tipo: 'merma' | 'ajuste'
  cantidad: number
  motivo: string
  nota: string
  creado_por: string
}) {
  const referencia = datos.nota ? `${datos.motivo} — ${datos.nota}` : datos.motivo

  const { data, error } = await supabase
    .from('movimientos_inventario')
    .insert({
      tenant_id: datos.tenant_id,
      sede_id: datos.sede_id,
      insumo_id: datos.insumo_id,
      tipo: datos.tipo,
      cantidad: datos.cantidad,
      referencia,
      creado_por: datos.creado_por,
    })
    .select()
    .single()

  if (error) throw error

  const signo = datos.tipo === 'ajuste' ? 1 : -1
  const { error: errorInventario } = await supabase.rpc('incrementar_inventario_sede', {
    p_sede_id: datos.sede_id,
    p_insumo_id: datos.insumo_id,
    p_cantidad: signo * datos.cantidad,
  })
  if (errorInventario) throw errorInventario

  return data
}

// Nombres de los platos que usan este insumo en su receta — para el
// chip "Usado en N recetas" del editor. No hay columna de relación
// directa insumo↔plato, se deriva uniendo por recetas.
export async function fetchPlatosPorInsumo(insumoId: string) {
  const { data, error } = await supabase
    .from('recetas')
    .select('menu_items(nombre)')
    .eq('insumo_id', insumoId)

  if (error) throw error
  return (data as unknown as { menu_items: { nombre: string } | null }[])
    .map((fila) => fila.menu_items?.nombre)
    .filter((nombre): nombre is string => Boolean(nombre))
}
