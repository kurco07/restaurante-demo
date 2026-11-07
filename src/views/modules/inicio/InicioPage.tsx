import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAplicarMarca } from '../../../controllers/marca/useAplicarMarca'
import { MarcaAguaFondo } from '../../components/ui/MarcaAguaFondo'
import type { MarcaPublica } from '../../../models/types/marca'
import { HeroCarousel } from './components/HeroCarousel'

// Home pública del restaurante — sin login, sin mesa. Es una vitrina (menú
// real, navegable) para que alguien conozca el restaurante antes de ir;
// pedir de verdad sigue siendo siempre en el local, escaneando el QR de la
// mesa (CLAUDE.md) — acá no hay carrito ni pago.
//
// El tenant queda fijo por ahora (un solo restaurante piloto en el MVP) —
// la idea a futuro es un link único por restaurante (ej. /inicio/:slug),
// todavía no construido.
const TENANT_ID = '5af2e299-3ae2-4f77-8248-c75e3f53a8e7'

interface Categoria {
  id: string
  nombre: string
}

interface Plato {
  id: string
  categoria_id: string
  nombre: string
  descripcion: string | null
  precio: number
  imagen_url: string | null
}

interface Sede {
  id: string
  nombre: string
  direccion: string | null
}

interface MenuPublico {
  restaurante: string
  marca: MarcaPublica
  sedes: Sede[]
  categorias: Categoria[]
  platos: Plato[]
}

const GRADIENTES = [
  'from-orange-300 to-orange-500',
  'from-amber-300 to-amber-500',
  'from-orange-400 to-red-500',
  'from-amber-200 to-orange-400',
  'from-orange-400 to-red-400',
  'from-amber-400 to-orange-600',
]

function gradientePara(id: string) {
  const indice = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENTES.length
  return GRADIENTES[indice]
}

export default function InicioPage() {
  const [menu, setMenu] = useState<MenuPublico | null>(null)
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const buscadorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .rpc('menu_publico_tenant', { p_tenant_id: TENANT_ID })
      .then(({ data }) => setMenu(data as MenuPublico | null))
  }, [])

  const platosFiltrados = useMemo(() => {
    if (!menu) return []
    let resultado = menu.platos
    if (categoriaActiva) resultado = resultado.filter((p) => p.categoria_id === categoriaActiva)
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      resultado = resultado.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q),
      )
    }
    return resultado
  }, [menu, categoriaActiva, busqueda])

  function irAlMenu(categoriaId?: string, enfocarBuscador?: boolean) {
    setCategoriaActiva(categoriaId ?? null)
    menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (enfocarBuscador) setTimeout(() => buscadorRef.current?.focus(), 400)
  }

  useAplicarMarca(menu?.marca)

  const nombreRestaurante = menu?.restaurante ?? 'Roof Burgers'
  const sedePrincipal = menu?.sedes[0]

  return (
    <div className="bg-[var(--orange-bg)]/30">
      <MarcaAguaFondo />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
        <div className="text-xl font-extrabold text-gray-900">{nombreRestaurante}</div>
        <nav className="hidden gap-7 text-sm font-medium text-gray-500 md:flex">
          <button type="button" onClick={() => irAlMenu()} className="hover:text-gray-900">
            Menú
          </button>
        </nav>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => irAlMenu(undefined, true)}
            aria-label="Buscar en el menú"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500"
          >
            🔍
          </button>
          <button
            type="button"
            onClick={() => irAlMenu()}
            className="rounded-full bg-[var(--orange)] px-5 py-2.5 text-sm font-bold text-white"
          >
            Ver menú
          </button>
        </div>
      </header>

      <HeroCarousel onVerMenu={() => irAlMenu()} sedeNombre={sedePrincipal?.nombre} />

      {menu && menu.categorias.length > 0 && (
        <section className="mx-auto max-w-5xl px-8 py-16">
          <div className="mb-8 text-center">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--orange)]">Elige tu antojo</p>
            <h2 className="text-2xl font-extrabold text-gray-900">¿Qué se te antoja hoy?</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {menu.categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => irAlMenu(cat.id)}
                className="flex flex-col items-center gap-2.5 text-center"
              >
                <div className="flex h-18.5 w-18.5 items-center justify-center rounded-full border border-[var(--orange-bg)] bg-[var(--orange-bg)]/70">
                  <IconoGenerico nombreCategoria={cat.nombre} />
                </div>
                <span className="max-w-24 text-sm font-semibold text-gray-800">{cat.nombre}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl rounded-[28px] bg-gray-900 px-8 py-12 md:px-14">
        <div className="mb-8 text-center">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--orange)]">Cómo funciona</p>
          <h2 className="text-2xl font-extrabold text-white">Pedir aquí es así de fácil</h2>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {PASOS.map((paso, i) => (
            <div key={paso.titulo} className="text-center text-white">
              <div className="mx-auto mb-3 flex h-13.5 w-13.5 items-center justify-center rounded-2xl bg-[var(--orange)] text-lg font-extrabold">
                {i + 1}
              </div>
              <p className="mb-1 text-sm font-bold">{paso.titulo}</p>
              <p className="text-xs leading-relaxed text-gray-400">{paso.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={menuRef} className="mx-auto max-w-5xl px-8 py-16 scroll-mt-6">
        <div className="mb-6 text-center">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--orange)]">Nuestra carta</p>
          <h2 className="text-2xl font-extrabold text-gray-900">El menú completo</h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-gray-500">
            Para pedir, escanea el código QR de tu mesa en el restaurante — este catálogo es solo para que explores
            antes de llegar.
          </p>
        </div>

        <div className="mx-auto mb-6 max-w-md">
          <input
            ref={buscadorRef}
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar un plato…"
            className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]/30"
          />
        </div>

        {menu && menu.categorias.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setCategoriaActiva(null)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
                categoriaActiva === null
                  ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                  : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              Todos
            </button>
            {menu.categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaActiva(cat.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${
                  categoriaActiva === cat.id
                    ? 'border-[var(--orange)] bg-[var(--orange)] text-white'
                    : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        )}

        {!menu ? (
          <p className="py-12 text-center text-sm text-gray-400">Cargando menú…</p>
        ) : platosFiltrados.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No hay platos que coincidan.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {platosFiltrados.map((plato) => (
              <div
                key={plato.id}
                className="rounded-2xl border border-gray-200 bg-white p-3 text-center transition-shadow hover:shadow-md"
              >
                <div
                  className={`mb-2.5 flex h-22.5 items-center justify-center rounded-xl bg-linear-to-br ${gradientePara(plato.id)}`}
                >
                  <IconoHamburguesa tamaño={32} trazo="#fff" />
                </div>
                <p className="text-sm font-bold text-gray-900">{plato.nombre}</p>
                <p className="text-xs font-bold text-[var(--orange-dark)]">${plato.precio.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-2 border-t border-gray-200 px-8 py-8 text-xs text-gray-500 md:flex-row md:justify-between">
        <span>
          © 2026 {nombreRestaurante}
          {sedePrincipal ? ` · ${sedePrincipal.nombre}` : ''}
        </span>
      </footer>
    </div>
  )
}

const PASOS = [
  { titulo: 'Escanea tu mesa', desc: 'Un código QR te lleva directo al menú' },
  { titulo: 'Arma tu pedido', desc: 'Elige lo que quieras, a tu ritmo' },
  { titulo: 'Confírmalo o pídelo al mesonero', desc: 'Tú decides cómo prefieres pedir' },
  { titulo: 'Disfruta', desc: 'Tu pedido llega directo a cocina' },
]

const PALABRAS_CLAVE_ICONO: [RegExp, () => React.ReactNode][] = [
  [/papa/i, () => <IconoPapas />],
  [/enrollad/i, () => <IconoEnrollado />],
  [/pepito|sandwich|sándwich/i, () => <IconoSandwich />],
  [/filadelfia|plancha/i, () => <IconoPlancha />],
  [/postre|dulce/i, () => <IconoPostre />],
]

function IconoGenerico({ nombreCategoria }: { nombreCategoria: string }) {
  const match = PALABRAS_CLAVE_ICONO.find(([re]) => re.test(nombreCategoria))
  return match ? match[1]() : <IconoHamburguesa />
}

function IconoHamburguesa({ tamaño = 30, trazo = '#e0650a' }: { tamaño?: number; trazo?: string }) {
  return (
    <svg width={tamaño} height={tamaño} viewBox="0 0 24 24" fill="none" stroke={trazo} strokeWidth={1.6}>
      <path d="M3 10h18M3 14h18M4 10a8 6 0 0116 0M4 14a1 1 0 001 1h14a1 1 0 001-1" />
    </svg>
  )
}

function IconoEnrollado() {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#e0650a" strokeWidth={1.6}>
      <rect x="4" y="6" width="16" height="12" rx="6" />
    </svg>
  )
}

function IconoPapas() {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#e0650a" strokeWidth={1.6}>
      <path d="M6 8l1 12h10l1-12M5 8h14M9 8V5a3 3 0 016 0v3" />
    </svg>
  )
}

function IconoSandwich() {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#e0650a" strokeWidth={1.6}>
      <path d="M3 14l9-9 9 9M4 14h16l-1 6H5z" />
    </svg>
  )
}

function IconoPlancha() {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#e0650a" strokeWidth={1.6}>
      <rect x="4" y="9" width="16" height="8" rx="2" />
      <path d="M8 9V6h8v3" />
    </svg>
  )
}

function IconoPostre() {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#e0650a" strokeWidth={1.6}>
      <path d="M12 3v18M6 8h12M6 16h12" />
    </svg>
  )
}
