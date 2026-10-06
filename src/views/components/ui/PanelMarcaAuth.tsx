import type { ReactNode } from 'react'
import { IconoRayo, IconoRestaurante, IconoWifiOff } from './IconosAuth'

interface PanelMarcaAuthProps {
  titulo: string
  descripcion: string
}

// Panel izquierdo compartido entre /login y /registro — mismo look & feel,
// cada pantalla solo cambia el titular. Reemplaza el tema de delivery del
// mockup de referencia por algo que sí tiene que ver con nuestro producto:
// cocina en tiempo real + modo offline, no repartidores ni envíos.
export function PanelMarcaAuth({ titulo, descripcion }: PanelMarcaAuthProps) {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-orange-600 p-12 text-white lg:flex">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-orange-300 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-orange-800 opacity-30 blur-2xl" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-md">
          <IconoRestaurante className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-white">Plataforma de Restaurantes</span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-orange-200">
            Pedidos · Cocina · Inventario
          </span>
        </div>
      </div>

      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-10">
        <div className="relative flex w-full max-w-[360px] items-center justify-center">
          <Badge icono={<IconoRayo className="h-4 w-4 text-orange-200" />} clase="-top-2 left-0 -rotate-3">
            Pedido → cocina al instante
          </Badge>
          <Badge icono={<IconoWifiOff className="h-4 w-4 text-orange-200" />} clase="bottom-2 right-0 rotate-2">
            Sigue andando sin internet
          </Badge>

          <PlatoIlustracion />
        </div>
      </div>

      <div className="relative z-10 max-w-md">
        <h2 className="mb-2 text-2xl font-bold leading-tight text-white">{titulo}</h2>
        <p className="text-sm leading-relaxed text-orange-100">{descripcion}</p>
      </div>
    </div>
  )
}

function Badge({ icono, children, clase }: { icono: ReactNode; children: ReactNode; clase: string }) {
  return (
    <div
      className={`absolute z-10 flex items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2 text-[#2b2118] shadow-lg ${clase}`}
    >
      {icono}
      <span className="text-[11px] font-bold leading-tight">{children}</span>
    </div>
  )
}

function PlatoIlustracion() {
  return (
    <svg viewBox="0 0 320 320" className="h-72 w-72 drop-shadow-xl" fill="none">
      <circle cx="160" cy="160" r="130" fill="#ffdbce" opacity="0.15" />
      <circle cx="160" cy="160" r="105" fill="none" stroke="white" strokeOpacity="0.3" strokeDasharray="8 8" strokeWidth="2" />
      <ellipse cx="160" cy="245" rx="95" ry="12" fill="#000" opacity="0.15" />

      {/* Plato */}
      <ellipse cx="160" cy="195" rx="92" ry="26" fill="#FFFFFF" />
      <ellipse cx="160" cy="190" rx="92" ry="26" fill="#FFFFFF" />
      <ellipse cx="160" cy="190" rx="68" ry="18" fill="#FFE8D6" />

      {/* Campana (cloche) levantándose */}
      <path d="M90 170C90 128 121 100 160 100s70 28 70 70" fill="#FFFFFF" stroke="#FFDBCE" strokeWidth="3" />
      <rect x="150" y="78" width="20" height="14" rx="4" fill="#FFFFFF" />
      <circle cx="160" cy="76" r="7" fill="#FFFFFF" />

      {/* Vapor */}
      <path d="M130 70c-6-10 4-14-2-24" stroke="white" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
      <path d="M160 62c-6-10 4-16-2-26" stroke="white" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
      <path d="M190 70c-6-10 4-14-2-24" stroke="white" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
