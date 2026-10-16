import { powerSync } from '../../lib/powerSyncClient'

// Escrituras locales PowerSync — mesas/sesiones_mesa son offline-críticas
// (arquitectura.md §4.11), así que esto nunca llama a Supabase directo: se
// escribe en la SQLite local y PowerSync encola la subida solo cuando hay
// conexión (SupabaseConnector.uploadData en lib/powerSyncClient.ts).

export async function abrirMesa(
  mesa: { id: string; tenant_id: string; sede_id: string },
  mesoneroId: string,
) {
  const sesionId = crypto.randomUUID()
  const ahora = new Date().toISOString()

  await powerSync.writeTransaction(async (tx) => {
    await tx.execute(
      `insert into sesiones_mesa
         (id, tenant_id, sede_id, mesa_id, mesonero_id, estado, origen, abierta_en, cerrada_en)
       values (?, ?, ?, ?, ?, 'abierta', 'mesonero', ?, null)`,
      [sesionId, mesa.tenant_id, mesa.sede_id, mesa.id, mesoneroId, ahora],
    )
    await tx.execute(`update mesas set estado = 'ocupada' where id = ?`, [mesa.id])
  })

  return sesionId
}

export async function marcarMesaLibre(mesaId: string) {
  await powerSync.execute(`update mesas set estado = 'libre' where id = ?`, [mesaId])
}

// Una sesión abierta por el cliente con el QR (enviar_pedido_autopedido,
// migración 0004) nace con mesonero_id nulo. Lo normal es que la tome
// quien aprueba su pedido (aprobarPedidoAutopedido); esto cubre el caso
// en que el mesonero la toma sin pedido por aprobar, para no abrir una
// segunda sesión sobre la misma mesa. Escritura local PowerSync, igual
// que abrirMesa. Si dos mesoneros la toman sin conexión a la vez, gana
// la última escritura que llegue al servidor.
export async function atenderMesa(sesionId: string, mesoneroId: string) {
  await powerSync.execute(`update sesiones_mesa set mesonero_id = ? where id = ? and mesonero_id is null`, [
    mesoneroId,
    sesionId,
  ])
}

// Pasa una mesa abierta a otro mesonero (solo supervisor, Fase 2 Módulo
// 7). Escritura local PowerSync; la base valida el rol al subir
// (migración 0015).
export async function transferirMesa(sesionId: string, mesoneroId: string) {
  await powerSync.execute(`update sesiones_mesa set mesonero_id = ? where id = ?`, [mesoneroId, sesionId])
}
