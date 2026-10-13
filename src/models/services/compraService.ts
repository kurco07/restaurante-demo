import { supabase } from '../../lib/supabaseClient'
import type { EstadoOrdenCompra, Insumo } from '../types'

export interface ItemOrdenCompraDetalle {
  insumo_id: string
  insumo: string
  unidad: string
  tipo: Insumo['tipo']
  cantidad: number
  costo_estimado: number | null
}

export interface OrdenCompraConDetalle {
  id: string
  codigo: string
  tenant_id: string
  sede_id: string
  estado: EstadoOrdenCompra
  proveedor_id: string
  proveedor: string
  solicitadaPor: string
  aprobada_por: string | null
  creado_en: string
  items: ItemOrdenCompraDetalle[]
}

function codigoCorto(id: string) {
  return `OC-${id.slice(0, 8).toUpperCase()}`
}

interface FilaOrdenRaw {
  id: string
  tenant_id: string
  sede_id: string
  estado: EstadoOrdenCompra
  proveedor_id: string
  aprobada_por: string | null
  creado_en: string
  proveedores: { nombre: string } | null
  usuarios: { nombre: string } | null
  ordenes_compra_items: {
    insumo_id: string
    cantidad: number
    costo_estimado: number | null
    insumos: { nombre: string; unidad_de_medida: string; tipo: Insumo['tipo'] } | null
  }[]
}

function mapOrden(fila: FilaOrdenRaw): OrdenCompraConDetalle {
  return {
    id: fila.id,
    codigo: codigoCorto(fila.id),
    tenant_id: fila.tenant_id,
    sede_id: fila.sede_id,
    estado: fila.estado,
    proveedor_id: fila.proveedor_id,
    proveedor: fila.proveedores?.nombre ?? '—',
    solicitadaPor: fila.usuarios?.nombre ?? 'IA (sugerida)',
    aprobada_por: fila.aprobada_por,
    creado_en: fila.creado_en,
    items: fila.ordenes_compra_items.map((item) => ({
      insumo_id: item.insumo_id,
      insumo: item.insumos?.nombre ?? '—',
      unidad: item.insumos?.unidad_de_medida ?? '',
      tipo: item.insumos?.tipo ?? 'exacto',
      cantidad: item.cantidad,
      costo_estimado: item.costo_estimado,
    })),
  }
}

export function totalOrden(orden: OrdenCompraConDetalle) {
  return orden.items.reduce((suma, item) => suma + item.cantidad * (item.costo_estimado ?? 0), 0)
}

// creada_por tiene dos FK distintas hacia usuarios (creada_por/aprobada_por)
// — se desambigua con el hint `usuarios!creada_por(...)`, igual que
// PostgREST lo documenta para columnas FK repetidas hacia la misma tabla.
export async function fetchOrdenes(tenantId: string, sedeId: string): Promise<OrdenCompraConDetalle[]> {
  const { data, error } = await supabase
    .from('ordenes_compra')
    .select(
      `id, tenant_id, sede_id, estado, proveedor_id, aprobada_por, creado_en,
       proveedores(nombre),
       usuarios!creada_por(nombre),
       ordenes_compra_items(insumo_id, cantidad, costo_estimado, insumos(nombre, unidad_de_medida, tipo))`,
    )
    .eq('tenant_id', tenantId)
    .eq('sede_id', sedeId)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return (data as unknown as FilaOrdenRaw[]).map(mapOrden)
}

export async function crearOrdenBorrador(datos: {
  tenant_id: string
  sede_id: string
  proveedor_id: string
  creada_por: string
  items: { insumo_id: string; cantidad: number; costo_estimado: number | null }[]
}) {
  const { data: orden, error } = await supabase
    .from('ordenes_compra')
    .insert({
      tenant_id: datos.tenant_id,
      sede_id: datos.sede_id,
      proveedor_id: datos.proveedor_id,
      creada_por: datos.creada_por,
    })
    .select()
    .single()
  if (error) throw error

  const { error: errorItems } = await supabase.from('ordenes_compra_items').insert(
    datos.items.map((item) => ({
      tenant_id: datos.tenant_id,
      orden_compra_id: orden.id,
      insumo_id: item.insumo_id,
      cantidad: item.cantidad,
      costo_estimado: item.costo_estimado,
    })),
  )
  if (errorItems) throw errorItems

  return orden.id as string
}

// Reemplaza todos los items del borrador — más simple que diffear altas
// y bajas, y un borrador no tiene aún movimientos de inventario que
// dependan de los items anteriores.
export async function actualizarItemsBorrador(
  ordenId: string,
  tenantId: string,
  items: { insumo_id: string; cantidad: number; costo_estimado: number | null }[],
) {
  const { error: errorBorrado } = await supabase.from('ordenes_compra_items').delete().eq('orden_compra_id', ordenId)
  if (errorBorrado) throw errorBorrado

  const { error: errorInsert } = await supabase.from('ordenes_compra_items').insert(
    items.map((item) => ({
      tenant_id: tenantId,
      orden_compra_id: ordenId,
      insumo_id: item.insumo_id,
      cantidad: item.cantidad,
      costo_estimado: item.costo_estimado,
    })),
  )
  if (errorInsert) throw errorInsert
}

// Nunca se auto-ejecuta: siempre requiere que un humano la apruebe (ver
// `aprobada_por` en CLAUDE.md).
export async function aprobarOrden(id: string, usuarioId: string) {
  const { error } = await supabase
    .from('ordenes_compra')
    .update({ estado: 'aprobada', aprobada_por: usuarioId })
    .eq('id', id)
  if (error) throw error
}

// Descartar un borrador es simplemente eliminarlo — no existe un estado
// "rechazada" en la base (decisión confirmada con el usuario).
export async function eliminarBorrador(id: string) {
  const { error } = await supabase.from('ordenes_compra').delete().eq('id', id)
  if (error) throw error
}

// Al recibir: cada item suma a inventario_sede (RPC atómico, igual que
// registrarLote) y deja un movimiento 'entrada' con referencia a la
// orden. Si el insumo es 'por_lote', además abre un lote nuevo — la
// fecha de vencimiento se pide aquí mismo, igual que al registrar un
// lote a mano (no se asume una fecha).
export async function registrarRecepcion(
  orden: OrdenCompraConDetalle,
  fechasVencimiento: Record<string, string | null>,
) {
  for (const item of orden.items) {
    if (item.tipo === 'por_lote') {
      const { error: errorLote } = await supabase.from('lotes_insumo').insert({
        tenant_id: orden.tenant_id,
        sede_id: orden.sede_id,
        insumo_id: item.insumo_id,
        cantidad_inicial: item.cantidad,
        cantidad_restante: item.cantidad,
        fecha_vencimiento: fechasVencimiento[item.insumo_id] ?? null,
      })
      if (errorLote) throw errorLote
    }

    const { error: errorInc } = await supabase.rpc('incrementar_inventario_sede', {
      p_sede_id: orden.sede_id,
      p_insumo_id: item.insumo_id,
      p_cantidad: item.cantidad,
    })
    if (errorInc) throw errorInc

    const { error: errorMov } = await supabase.from('movimientos_inventario').insert({
      tenant_id: orden.tenant_id,
      sede_id: orden.sede_id,
      insumo_id: item.insumo_id,
      tipo: 'entrada',
      cantidad: item.cantidad,
      referencia: `Orden ${orden.codigo}`,
    })
    if (errorMov) throw errorMov
  }

  const { error } = await supabase.from('ordenes_compra').update({ estado: 'recibida' }).eq('id', orden.id)
  if (error) throw error
}
