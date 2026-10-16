import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ItemCarrito } from '../../models/types'
import { CarritoContext, type Borradores, type CarritoContextValue } from './carritoContext'

function claveStorage(usuarioId: string) {
  return `carritos:${usuarioId}`
}

// localStorage puede no estar disponible (modo privado, bloqueado): en ese
// caso los borradores viven solo en memoria mientras la app está abierta.
function leer(usuarioId: string): Borradores {
  try {
    const crudo = localStorage.getItem(claveStorage(usuarioId))
    return crudo ? (JSON.parse(crudo) as Borradores) : {}
  } catch {
    return {}
  }
}

function guardar(usuarioId: string, borradores: Borradores) {
  try {
    localStorage.setItem(claveStorage(usuarioId), JSON.stringify(borradores))
  } catch {
    // sin almacenamiento: se sigue en memoria
  }
}

function sinVacios(borradores: Borradores): Borradores {
  return Object.fromEntries(Object.entries(borradores).filter(([, items]) => items.length > 0))
}

// Borradores de pedido del mesonero. Viven fuera de las páginas para que
// sobrevivan a la navegación entre Mesas, Menú y Mis pedidos, y se guardan
// en el dispositivo para sobrevivir a una recarga sin internet. Son solo
// locales: cocina ve un plato recién cuando se envía (pedidoService.ts).
export function CarritoProvider({ usuarioId, children }: { usuarioId: string; children: ReactNode }) {
  const [borradores, setBorradores] = useState<Borradores>(() => leer(usuarioId))

  useEffect(() => {
    guardar(usuarioId, borradores)
  }, [usuarioId, borradores])

  const valor = useMemo<CarritoContextValue>(() => {
    function actualizar(clave: string, cambio: (items: ItemCarrito[]) => ItemCarrito[]) {
      setBorradores((prev) => sinVacios({ ...prev, [clave]: cambio(prev[clave] ?? []) }))
    }

    return {
      borradores,
      itemsDe: (clave) => borradores[clave] ?? [],
      agregar: (clave, item) => actualizar(clave, (items) => [...items, item]),
      cambiarCantidad: (clave, itemId, delta) =>
        actualizar(clave, (items) =>
          items.map((item) => {
            if (item.id !== itemId) return item
            const cantidad = Math.max(1, item.cantidad + delta)
            return { ...item, cantidad, precioTotal: item.precioBase * cantidad }
          }),
        ),
      quitar: (clave, itemId) => actualizar(clave, (items) => items.filter((item) => item.id !== itemId)),
      vaciar: (clave) => actualizar(clave, () => []),
      mover: (desde, hacia) => {
        if (desde === hacia) return
        setBorradores((prev) =>
          sinVacios({ ...prev, [hacia]: [...(prev[hacia] ?? []), ...(prev[desde] ?? [])], [desde]: [] }),
        )
      },
      totalPlatos: Object.values(borradores)
        .flat()
        .reduce((s, item) => s + item.cantidad, 0),
    }
  }, [borradores])

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>
}
