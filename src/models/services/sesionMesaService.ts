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
