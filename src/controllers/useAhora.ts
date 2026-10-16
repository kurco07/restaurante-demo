import { useEffect, useState } from 'react'

// La hora actual, refrescada cada `cadaMs`. Para relojes y para que los
// "hace N min" de una pantalla fija (cocina) avancen sin que nadie la toque.
export function useAhora(cadaMs = 30_000) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cadaMs)
    return () => clearInterval(id)
  }, [cadaMs])

  return ahora
}
