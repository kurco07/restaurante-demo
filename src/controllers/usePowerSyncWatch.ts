import { useEffect, useState } from 'react'
import type { SqliteRecord } from '@powersync/web'
import { powerSync } from '../lib/powerSyncClient'

// Query reactiva contra la base SQLite local — se actualiza sola cuando
// cambian los datos (escritura propia o sincronización entrante), sin
// recargar. Para mesas/pedidos/cocina, que cambian todo el tiempo y deben
// verse igual entre pantallas, en vez del fetch-único que usa el menú.
export function usePowerSyncWatch<T = SqliteRecord>(
  sql: string,
  parameters: unknown[] = [],
): T[] {
  const [filas, setFilas] = useState<T[]>([])

  useEffect(() => {
    const controller = new AbortController()

    powerSync.watch(
      sql,
      parameters,
      {
        onResult: (result) => setFilas(result.array as T[]),
        onError: (error) => console.error('[PowerSync watch]', sql, error),
      },
      { signal: controller.signal },
    )

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql, JSON.stringify(parameters)])

  return filas
}
