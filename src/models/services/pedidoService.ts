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
