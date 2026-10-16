import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'

// Pestaña dedicada y aislada para "Ver en RA" (/ar?glb=...&nombre=...) — se
// abre con window.open() desde el modal de personalización en vez de
// mostrarse superpuesta en la misma página. AR.js/A-Frame activan la cámara
// y, en Android/Chrome, eso deja a veces window.innerWidth/innerHeight
// corruptos tras cerrar (confirmado con capturas reales: un elemento pasó
// de 989x742px a 3493x2620px entre ciclos) — un bug del navegador que no se
// pudo evitar ni quitando la Fullscreen API. Aislar la cámara en su propia
// pestaña hace que ese bug, si ocurre, se quede contenido ahí: la pestaña
// de pedidos original nunca se toca, así que cerrar la de RA siempre
// devuelve al cliente a su carrito intacto.
const VisorARMarcador = lazy(() =>
  import('../../components/ui/VisorARMarcador').then((m) => ({ default: m.VisorARMarcador })),
)

export default function VistaARPage() {
  const [params] = useSearchParams()
  const glbUrl = params.get('glb')
  const nombre = params.get('nombre') ?? 'el plato'
  const nombreRestaurante = params.get('restaurante') ?? undefined

  if (!glbUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#2b2118] p-6 text-center text-white">
        <p>Falta el modelo 3D para mostrar la RA.</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#2b2118]" />}>
      <VisorARMarcador
        glbUrl={glbUrl}
        nombre={nombre}
        nombreRestaurante={nombreRestaurante}
        onCerrar={() => window.close()}
      />
    </Suspense>
  )
}
