import { useEffect, useState, type ReactNode } from 'react'

interface Slide {
  badge: string
  badgeClase: string
  heading: ReactNode
  texto: string
  ctaLabel: string
  gradiente: string
  icono: ReactNode
}

const slides: Slide[] = [
  {
    badge: 'Oferta especial · 30% off',
    badgeClase: 'bg-red-500',
    heading: (
      <>
        Rápido, fresco <span className="text-orange-500">y sin vueltas.</span>
      </>
    ),
    texto: 'Hamburguesas, pepitos y papas hechos al momento — pide desde tu mesa o llévalo contigo.',
    ctaLabel: 'Ver el menú completo',
    gradiente: 'from-orange-300 to-orange-500',
    icono: (
      <svg width={110} height={110} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.3}>
        <path d="M3 10h18M3 14h18M4 10a8 6 0 0116 0M4 14a1 1 0 001 1h14a1 1 0 001-1" />
      </svg>
    ),
  },
  {
    badge: 'Nuevo en la carta',
    badgeClase: 'bg-orange-600',
    heading: (
      <>
        Conoce el <span className="text-orange-500">Triroof.</span>
      </>
    ),
    texto: 'Nuestra hamburguesa insignia: carne, pollo y chuleta ahumada en un solo plato.',
    ctaLabel: 'Ver el Triroof',
    gradiente: 'from-amber-400 to-red-500',
    icono: (
      <svg width={110} height={110} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.3}>
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    badge: 'Este finde',
    badgeClase: 'bg-amber-600',
    heading: (
      <>
        Postres de la casa <span className="text-orange-500">a mitad de precio.</span>
      </>
    ),
    texto: 'Marquesa de chocolate y pie de la casa, con descuento solo sábado y domingo.',
    ctaLabel: 'Ver postres',
    gradiente: 'from-orange-400 to-amber-600',
    icono: (
      <svg width={110} height={110} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.3}>
        <path d="M12 3v18M6 8h12M6 16h12" />
      </svg>
    ),
  },
]

interface HeroCarouselProps {
  onVerMenu: () => void
  sedeNombre?: string
}

export function HeroCarousel({ onVerMenu, sedeNombre }: HeroCarouselProps) {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndice((i) => (i + 1) % slides.length), 6000)
    return () => clearInterval(id)
  }, [])

  const slide = slides[indice]

  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-orange-100/70 p-10 md:p-14">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div>
          <span className={`mb-3 inline-block rounded-full px-3.5 py-1.5 text-xs font-bold text-white ${slide.badgeClase}`}>
            {slide.badge}
          </span>
          <h1 className="mb-3 text-4xl font-extrabold leading-[1.05] text-gray-900 md:text-5xl">{slide.heading}</h1>
          <p className="mb-6 max-w-sm text-sm text-gray-600">{slide.texto}</p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onVerMenu}
              className="rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-white"
            >
              {slide.ctaLabel}
            </button>
            {sedeNombre && <span className="text-sm font-semibold text-gray-500">📍 {sedeNombre}</span>}
          </div>
        </div>
        <div className={`flex h-70 items-center justify-center rounded-[20px] bg-linear-to-br ${slide.gradiente}`}>
          {slide.icono}
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.badge}
            type="button"
            onClick={() => setIndice(i)}
            aria-label={`Ir a la promoción ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === indice ? 'w-6 bg-orange-500' : 'w-2 bg-orange-300'}`}
          />
        ))}
      </div>
    </section>
  )
}
