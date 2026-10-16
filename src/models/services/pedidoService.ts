import { powerSync } from '../../lib/powerSyncClient'
import type { ItemCarrito } from '../types'

// Escritura local PowerSync — toma de pedidos es offline-crítica
// (arquitectura.md §4.11). client_local_id es la clave de deduplicación
// (unique(sesion_id, client_local_id) en la migración 0002): se reusa el
// mismo uuid generado en el dispositivo como id local y como
// client_local_id, así una reintentada de la misma fila nunca duplica.
export async function enviarPedidoACocina(
  contexto: { tenant_id: string; sede_id: string; sesion_id: string; agregadoPor: string },
  items: ItemCarrito[],
) {
  const ahora = new Date().toISOString()

  await powerSync.writeTransaction(async (tx) => {
    for (const item of items) {
      const idLocal = crypto.randomUUID()
      await tx.execute(
        `insert into pedidos_items
           (id, tenant_id, sede_id, sesion_id, menu_item_id, cantidad, precio_unitario, notas, agregado_por, estado, client_local_id, sincronizado_en, creado_en)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, null, ?)`,
        [
          idLocal,
          contexto.tenant_id,
          contexto.sede_id,
          contexto.sesion_id,
          item.menuItemId,
          item.cantidad,
          item.precioBase,
          item.nota || null,
          contexto.agregadoPor,
          idLocal,
          ahora,
        ],
      )
    }
  })
}

// Aprueba el pedido del autopedido: pasa todos sus ítems a 'pendiente'
// (recién ahí cocina los ve) y, si la sesión no tenía mesonero asignado
// (la abrió el cliente por QR), deja al que aprueba como su mesonero —
// aprobar la primera orden de una mesa sin atender es, en la práctica,
// hacerse cargo de ella.
export async function aprobarPedidoAutopedido(sesionId: string, usuarioId: string) {
  await powerSync.writeTransaction(async (tx) => {
    await tx.execute(`update pedidos_items set estado = 'pendiente' where sesion_id = ? and estado = 'por_aprobar'`, [
      sesionId,
    ])
    await tx.execute(`update sesiones_mesa set mesonero_id = ? where id = ? and mesonero_id is null`, [
      usuarioId,
      sesionId,
    ])
  })
}

// Avanza de una vez todos los ítems de una mesa que compartían el mismo
// estado (el "ticket" que ve cocina) — no uno por uno, para que la
// tarjeta completa cambie de columna junta.
export async function avanzarItemsDeSesion(
  sesionId: string,
  estadoActual: 'pendiente' | 'en_preparacion' | 'listo',
  estadoNuevo: 'en_preparacion' | 'listo' | 'entregado',
) {
  await powerSync.execute(`update pedidos_items set estado = ? where sesion_id = ? and estado = ?`, [
    estadoNuevo,
    sesionId,
    estadoActual,
  ])
}

// Anula un plato ya enviado a cocina (solo supervisor, Fase 2 Módulo 7).
// Escritura local PowerSync: funciona sin internet. La base valida al
// subir (migración 0015): rol, estado (nunca entregado) y motivo; pone
// quién y desde qué estado, y registra merma si ya se estaba preparando.
export async function anularItem(itemId: string, motivo: string) {
  await powerSync.execute(
    `update pedidos_items
        set estado = 'anulado', anulado_desde = estado, motivo_anulacion = ?, anulado_en = ?
      where id = ? and estado in ('pendiente', 'en_preparacion', 'listo')`,
    [motivo.trim(), new Date().toISOString(), itemId],
  )
}

// Anula de una vez todos los platos activos de una mesa (solo supervisor)
// en vez de uno por uno — mismo motivo para todos. Igual que anularItem,
// la base valida cada fila al subir (migración 0015) y, si no queda nada
// activo, libera la mesa sola (migración 0016).
export async function anularSesionCompleta(sesionId: string, motivo: string) {
  await powerSync.execute(
    `update pedidos_items
        set estado = 'anulado', anulado_desde = estado, motivo_anulacion = ?, anulado_en = ?
      where sesion_id = ? and estado in ('pendiente', 'en_preparacion', 'listo')`,
    [motivo.trim(), new Date().toISOString(), sesionId],
  )
}

// Cocina confirma que vio las anulaciones de un ticket: dejan de verse
// tachadas en el tablero.
export async function confirmarAnulaciones(itemIds: string[]) {
  if (itemIds.length === 0) return
  await powerSync.execute(
    `update pedidos_items set anulacion_vista_en = ? where id in (${itemIds.map(() => '?').join(', ')})`,
    [new Date().toISOString(), ...itemIds],
  )
}
