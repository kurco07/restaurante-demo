import { Link } from 'react-router-dom'
import { HeroCarousel } from './components/HeroCarousel'

// Home pública del restaurante — sin login, es lo primero que ve un cliente.
// Todavía sin funcionalidad real: los CTAs navegan a /proximamente hasta que
// se construya el flujo real de menú/pedido (Fase 3).

const navLinks = ['Menú', 'Ubicación', 'Nosotros', 'Contacto']

const categorias = [
  { nombre: 'Hamburguesas', icon: <IconoHamburguesa /> },
  { nombre: 'Enrollados', icon: <IconoEnrollado /> },
  { nombre: 'Papas fritas', icon: <IconoPapas /> },
  { nombre: 'Pepitos', icon: <IconoSandwich /> },
  { nombre: 'Filadelfia', icon: <IconoPlancha /> },
  { nombre: 'Postres', icon: <IconoPostre /> },
]

const pasos = [
  { titulo: 'Escanea tu mesa', desc: 'Un código QR te lleva directo al menú' },
  { titulo: 'Arma tu pedido', desc: 'Elige lo que quieras, a tu ritmo' },
  { titulo: 'Confírmalo o pídelo al mesonero', desc: 'Tú decides cómo prefieres pedir' },
  { titulo: 'Disfruta', desc: 'Tu pedido llega directo a cocina' },
]

// Precios reales del menú del cliente piloto (docs/Menu.md).
const favoritos = [
  { nombre: 'Cheese burger', precio: 11, gradiente: 'from-orange-300 to-orange-500' },
  { nombre: 'Triroof', precio: 13, gradiente: 'from-amber-300 to-amber-500' },
  { nombre: 'Ahumadita', precio: 9, gradiente: 'from-orange-400 to-red-500' },
  { nombre: 'Pepiroof', precio: 10, gradiente: 'from-amber-200 to-orange-400' },
  { nombre: 'Marquesa de chocolate', precio: 5, gradiente: 'from-orange-400 to-red-400' },
]

export default function InicioPage() {
  return (
    <div className="bg-orange-50/30">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
        <div className="text-xl font-extrabold text-gray-900">
          Roof <span className="text-orange-500">Burgers</span>
        </div>
        <nav className="hidden gap-7 text-sm font-medium text-gray-500 md:flex">
          {navLinks.map((label) => (
            <Link key={label} to="/proximamente" className="hover:text-gray-900">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/proximamente"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500"
          >
            🔍
          </Link>
          <Link
            to="/proximamente"
            className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white"
          >
            Pedir ahora
          </Link>
        </div>
      </header>

      <HeroCarousel />

      <section className="mx-auto max-w-5xl px-8 py-16">
        <div className="mb-8 text-center">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-orange-500">Elige tu antojo</p>
          <h2 className="text-2xl font-extrabold text-gray-900">¿Qué se te antoja hoy?</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {categorias.map((cat) => (
            <Link
              key={cat.nombre}
              to="/proximamente"
              className="flex flex-col items-center gap-2.5 text-center"
            >
              <div className="flex h-18.5 w-18.5 items-center justify-center rounded-full border border-orange-200 bg-orange-100/70">
                {cat.icon}
              </div>
              <span className="text-sm font-semibold text-gray-800">{cat.nombre}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl rounded-[28px] bg-gray-900 px-8 py-12 md:px-14">
        <div className="mb-8 text-center">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-orange-300">Cómo funciona</p>
          <h2 className="text-2xl font-extrabold text-white">Pedir aquí es así de fácil</h2>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {pasos.map((paso, i) => (
            <div key={paso.titulo} className="text-center text-white">
              <div className="mx-auto mb-3 flex h-13.5 w-13.5 items-center justify-center rounded-2xl bg-orange-500 text-lg font-extrabold">
                {i + 1}
              </div>
              <p className="mb-1 text-sm font-bold">{paso.titulo}</p>
              <p className="text-xs leading-relaxed text-gray-400">{paso.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-8 py-16">
        <div className="mb-8 text-center">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-orange-500">Lo más pedido</p>
          <h2 className="text-2xl font-extrabold text-gray-900">Los favoritos de la casa</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {favoritos.map((item) => (
            <Link
              key={item.nombre}
              to="/proximamente"
              className="rounded-2xl border border-gray-200 bg-white p-3 text-center transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-2.5 flex h-22.5 items-center justify-center rounded-xl bg-linear-to-br ${item.gradiente}`}
              >
                <IconoHamburguesa tamaño={32} trazo="#fff" />
              </div>
              <p className="text-sm font-bold text-gray-900">{item.nombre}</p>
              <p className="text-xs font-bold text-orange-600">${item.precio.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col items-center gap-5 rounded-[28px] bg-orange-100/70 p-10 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <h2 className="mb-1 text-xl font-extrabold text-gray-900">¿Ya se te antojó?</h2>
          <p className="text-sm text-gray-600">Descubre las más de 40 opciones que tenemos para ti.</p>
        </div>
        <Link to="/proximamente" className="rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-white">
          Ver el menú completo
        </Link>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-2 border-t border-gray-200 px-8 py-8 text-xs text-gray-500 md:flex-row md:justify-between">
        <span>© 2026 Roof Burgers</span>
        <nav className="flex gap-4">
          {navLinks.map((label) => (
            <Link key={label} to="/proximamente" className="hover:text-gray-800">
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  )
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
