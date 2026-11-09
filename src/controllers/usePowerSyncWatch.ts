import { useEffect, useRef, useState } from 'react'
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
  // Último resultado, para no volver a dibujar si no cambió nada (Fase 8,
  // Módulo 3). PowerSync vuelve a correr la consulta con cualquier cambio en
  // la tabla, aunque no toque estas filas: sin esto, cada plato que avanza en
  // cocina redibujaba todas las pantallas que leen pedidos_items, lo que se
  // nota en tablets de gama baja.
  const ultimo = useRef<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    ultimo.current = null

    powerSync.watch(
      sql,
      parameters,
      {
        onResult: (result) => {
          const json = JSON.stringify(result.array)
          if (json === ultimo.current) return
          ultimo.current = json
          setFilas(result.array as T[])
        },
        onError: (error) => console.error('[PowerSync watch]', sql, error),
      },
      { signal: controller.signal },
    )

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql, JSON.stringify(parameters)])

  return filas
}
