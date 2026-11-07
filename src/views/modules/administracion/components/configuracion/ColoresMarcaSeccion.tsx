import { useEffect, useRef, useState } from 'react'
import { fetchMarcaPropia, guardarMarcaPropia, subirLogoMarca } from '../../../../../models/services/marcaService'
import { FUENTES_DISPONIBLES } from '../../../../../controllers/marca/fuentesMarca'
import { useAplicarMarca } from '../../../../../controllers/marca/useAplicarMarca'
import type { Marca } from '../../../../../models/types/marca'
import { SeccionConfig } from './SeccionConfig'

// Fase 7, Módulo 4 — editor real contra personalizacion_marca (migración
// 0025: solo administracion/gerencia puede escribir). Ampliado en la
// Ronda 1 de personalización completa (migración 0036): color de
// acento, tipografía y marca de agua de fondo (reutiliza el logo ya
// subido, sin imagen aparte).
export function ColoresMarcaSeccion({ tenantId }: { tenantId: string }) {
  const [nombreMostrado, setNombreMostrado] = useState('')
  const [colorPrimario, setColorPrimario] = useState('#ff7a1a')
  const [colorSecundario, setColorSecundario] = useState('#e0650a')
  const [colorAcento, setColorAcento] = useState('#e0650a')
  const [sidebarPersonalizado, setSidebarPersonalizado] = useState(false)
  const [colorSidebar, setColorSidebar] = useState('#2b2118')
  const [fuente, setFuente] = useState('')
  const [marcaAguaActiva, setMarcaAguaActiva] = useState(false)
  const [marcaAguaOpacidad, setMarcaAguaOpacidad] = useState(0.06)
  const [marcaAguaTamano, setMarcaAguaTamano] = useState(680)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [estado, setEstado] = useState<'inactivo' | 'guardando' | 'guardado' | 'error'>('inactivo')
  const inputLogoRef = useRef<HTMLInputElement>(null)

  // Lo último confirmado como guardado en la base — es lo que se aplica
  // de inmediato a las variables CSS (useAplicarMarca), para no esperar a
  // un reinicio de sesión para ver el cambio. A propósito NO se aplica el
  // estado local mientras se edita (antes de guardar): si alguien cambia
  // colores y sale sin guardar, no queremos que ese preview sin confirmar
  // se quede pegado en el resto de la app.
  const [marcaAplicada, setMarcaAplicada] = useState<Marca | undefined>(undefined)
  useAplicarMarca(marcaAplicada)

  useEffect(() => {
    fetchMarcaPropia()
      .then((marca) => {
        if (marca) {
          setNombreMostrado(marca.nombre_mostrado ?? '')
          setColorPrimario(marca.color_primario ?? '#ff7a1a')
          setColorSecundario(marca.color_secundario ?? '#e0650a')
          setColorAcento(marca.color_acento ?? '#e0650a')
          setSidebarPersonalizado(!!marca.color_sidebar)
          setColorSidebar(marca.color_sidebar ?? '#2b2118')
          setFuente(marca.fuente ?? '')
          setMarcaAguaActiva(marca.marca_agua_activa)
          setMarcaAguaOpacidad(marca.marca_agua_opacidad)
          setMarcaAguaTamano(marca.marca_agua_tamano)
          setLogoUrl(marca.logo_url)
        }
      })
      .finally(() => setCargando(false))
  }, [])

  async function guardar() {
    setEstado('guardando')
    try {
      const cambios = {
        nombre_mostrado: nombreMostrado.trim() || null,
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
        color_acento: colorAcento,
        color_sidebar: sidebarPersonalizado ? colorSidebar : null,
        fuente: fuente || null,
        marca_agua_activa: marcaAguaActiva,
        marca_agua_opacidad: marcaAguaOpacidad,
        marca_agua_tamano: marcaAguaTamano,
      }
      await guardarMarcaPropia(tenantId, cambios)
      setEstado('guardado')
      setMarcaAplicada({ ...cambios, logo_url: logoUrl })
    } catch {
      setEstado('error')
    }
  }

  async function subirLogo(archivo: File) {
    setEstado('guardando')
    try {
      const url = await subirLogoMarca(tenantId, archivo)
      await guardarMarcaPropia(tenantId, { logo_url: url })
      setLogoUrl(url)
      setEstado('guardado')
      setMarcaAplicada({
        nombre_mostrado: nombreMostrado.trim() || null,
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
        color_acento: colorAcento,
        color_sidebar: sidebarPersonalizado ? colorSidebar : null,
        fuente: fuente || null,
        marca_agua_activa: marcaAguaActiva,
        marca_agua_opacidad: marcaAguaOpacidad,
        marca_agua_tamano: marcaAguaTamano,
        logo_url: url,
      })
    } catch {
      setEstado('error')
    }
  }

  if (cargando) return null

  return (
    <SeccionConfig titulo="Marca del restaurante" subtitulo="Se usan en todas las pantallas: app pública, menú digital, autopedido por QR y el panel interno">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo del restaurante" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-[var(--ink-soft)]">Sin logo</span>
            )}
          </div>
          <input
            ref={inputLogoRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              e.target.value = ''
              if (archivo) subirLogo(archivo)
            }}
          />
          <button
            type="button"
            onClick={() => inputLogoRef.current?.click()}
            className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-xs font-bold text-[var(--ink)]"
          >
            Cambiar logo
          </button>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--ink)]">
          Nombre mostrado
          <input
            type="text"
            value={nombreMostrado}
            onChange={(e) => setNombreMostrado(e.target.value)}
            placeholder="Como quieres que se vea tu restaurante en la app"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
          />
        </label>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2.5 text-xs font-bold text-[var(--ink)]">
            Color primario
            <input
              type="color"
              value={colorPrimario}
              onChange={(e) => setColorPrimario(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-md border border-[var(--border)]"
            />
          </label>
          <label className="flex items-center gap-2.5 text-xs font-bold text-[var(--ink)]">
            Color secundario
            <input
              type="color"
              value={colorSecundario}
              onChange={(e) => setColorSecundario(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-md border border-[var(--border)]"
            />
          </label>
          <label className="flex items-center gap-2.5 text-xs font-bold text-[var(--ink)]">
            Color de acento
            <input
              type="color"
              value={colorAcento}
              onChange={(e) => setColorAcento(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-md border border-[var(--border)]"
            />
          </label>
        </div>

        <div className="rounded-lg border border-[var(--border)] p-3.5">
          <label className="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
            Color de la barra lateral (Administración y Gerencia)
            <button
              type="button"
              role="switch"
              aria-checked={sidebarPersonalizado}
              onClick={() => setSidebarPersonalizado((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                sidebarPersonalizado ? 'bg-[var(--orange)]' : 'bg-[var(--border)]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  sidebarPersonalizado ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          {sidebarPersonalizado && (
            <div className="mt-3 flex items-center gap-2.5">
              <input
                type="color"
                value={colorSidebar}
                onChange={(e) => setColorSidebar(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-md border border-[var(--border)]"
              />
              <span className="text-xs text-[var(--ink-soft)]">El texto se ajusta solo a blanco o negro para que se siga leyendo bien</span>
            </div>
          )}
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--ink)]">
          Tipografía
          <select
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal"
            style={fuente ? { fontFamily: `'${fuente}'` } : undefined}
          >
            <option value="">Por defecto de la plataforma</option>
            {FUENTES_DISPONIBLES.map((f) => (
              <option key={f.valor} value={f.valor} style={{ fontFamily: `'${f.valor}'` }}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-[var(--border)] p-3.5">
          <label className="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
            Marca de agua de fondo (tu logo, discreto, en todas las pantallas)
            <button
              type="button"
              role="switch"
              aria-checked={marcaAguaActiva}
              onClick={() => setMarcaAguaActiva((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                marcaAguaActiva ? 'bg-[var(--orange)]' : 'bg-[var(--border)]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  marcaAguaActiva ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          {marcaAguaActiva && (
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-soft)]">
                Qué tan visible ({Math.round(marcaAguaOpacidad * 100)}%)
                <input
                  type="range"
                  min={0.02}
                  max={0.15}
                  step={0.01}
                  value={marcaAguaOpacidad}
                  onChange={(e) => setMarcaAguaOpacidad(Number(e.target.value))}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-soft)]">
                Qué tan grande ({marcaAguaTamano}px)
                <input
                  type="range"
                  min={200}
                  max={900}
                  step={20}
                  value={marcaAguaTamano}
                  onChange={(e) => setMarcaAguaTamano(Number(e.target.value))}
                />
              </label>
              {!logoUrl && <span className="text-xs text-[var(--red)]">Sube un logo arriba primero — la marca de agua lo usa a él.</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={guardar}
            disabled={estado === 'guardando'}
            className="w-fit rounded-lg bg-[var(--orange)] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {estado === 'guardando' ? 'Guardando…' : 'Guardar marca'}
          </button>
          {estado === 'guardado' && <span className="text-xs font-semibold text-[var(--green)]">Guardado</span>}
          {estado === 'error' && <span className="text-xs font-semibold text-[var(--red)]">No se pudo guardar</span>}
        </div>
      </div>
    </SeccionConfig>
  )
}
