import { useEffect, useRef, useState } from 'react'
// Solo se importa @ar-js-org/ar.js, NO 'aframe' por separado — su build
// para bundlers ya hace require("aframe") internamente, y si se
// importa aframe también acá quedan dos copias evaluándose, cada una
// registrando sus propios custom elements (a-node, a-entity...) con
// customElements.define(), que solo se puede llamar una vez por
// nombre — tira "NotSupportedError: ... has already been used" y
// rompe toda la carga del chunk (pantalla en blanco).
import '@ar-js-org/ar.js'

// A-Frame declara sus custom elements para el DOM nativo pero no para
// JSX de React — mismo motivo y misma técnica que VisorAR.tsx usa para
// <model-viewer> (augmentación sobre el módulo 'react', no sobre
// `declare global`, porque con el runtime automático de JSX el
// namespace que tsc revisa es React.JSX).
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        embedded?: boolean
        arjs?: string
        'vr-mode-ui'?: string
        renderer?: string
      }
      'a-marker': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        preset?: string
        type?: string
        url?: string
        emitevents?: string
      }
      'a-entity': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        camera?: boolean
        'gltf-model'?: string
        scale?: string
        position?: string
        rotation?: string
      }
    }
  }
}

interface VisorARMarcadorProps {
  glbUrl: string
  nombre: string
  nombreRestaurante?: string
  onCerrar: () => void
  // Mientras no llegue el logo del restaurante se usa el marcador "Hiro"
  // que ya trae AR.js de ejemplo — cuando llegue, pasar
  // markerType="pattern" + markerUrl="/marcadores-ar/logo-restaurante.patt"
  // en vez de estos dos (ver Paso 7 del plan).
  markerPreset?: string
  markerType?: 'pattern'
  markerUrl?: string
  // Calibración manual por modelo (ver Paso 6 del plan) — un escaneo de
  // fotogrametría normalmente viene en una escala real de metros, mucho
  // más grande que lo que se ve bien sobre un marcador de unos 10cm.
  escala?: string
  posicion?: string
  rotacion?: string
}

const SEGUNDOS_SIN_DETECTAR = 8

export function VisorARMarcador({
  glbUrl,
  nombre,
  nombreRestaurante = 'la marca',
  onCerrar,
  markerPreset = 'hiro',
  markerType,
  markerUrl,
  escala = '0.05 0.05 0.05',
  posicion = '0 0 0',
  rotacion = '0 0 0',
}: VisorARMarcadorProps) {
  const markerRef = useRef<HTMLElement>(null)
  const [marcadorDetectado, setMarcadorDetectado] = useState(false)
  const [mostrarAyuda, setMostrarAyuda] = useState(false)

  useEffect(() => {
    const marcador = markerRef.current
    if (!marcador) return

    function alEncontrar() {
      setMarcadorDetectado(true)
      setMostrarAyuda(false)
    }
    function alPerder() {
      setMarcadorDetectado(false)
    }

    marcador.addEventListener('markerFound', alEncontrar)
    marcador.addEventListener('markerLost', alPerder)
    return () => {
      marcador.removeEventListener('markerFound', alEncontrar)
      marcador.removeEventListener('markerLost', alPerder)
    }
  }, [])

  useEffect(() => {
    const temporizador = setTimeout(() => {
      if (!marcadorDetectado) setMostrarAyuda(true)
    }, SEGUNDOS_SIN_DETECTAR * 1000)
    return () => clearTimeout(temporizador)
  }, [marcadorDetectado])

  return (
    // Sin fondo propio a propósito, para no tapar el video de la cámara
    // que AR.js inyecta (id="arjs-video") detrás del canvas 3D.
    //
    // El <style> de abajo corrige dos cosas que hace A-Frame/AR.js por
    // su cuenta, pensando que la página no tiene nada más:
    // 1) aframe.css trae "a-scene video { display: none }" (pensada
    //    para videos-textura de assets) que también esconde el video
    //    de la cámara si queda como descendiente de <a-scene>.
    // 2) AR.js inyecta el <video id="arjs-video"> con z-index: -2 y el
    //    <canvas class="a-canvas"> con z-index negativo también,
    //    directo como hijos de <body> (no de este wrapper) — un
    //    z-index negativo los manda detrás del #root de la SPA (que
    //    tiene fondo opaco y z-index normal), así que aunque el video
    //    ya esté "visible" queda tapado por el fondo de la app entera.
    //    Confirmado con un dump en consola del elemento real:
    //    {display:'block', zIndex:'-2', ...} — procesaba cuadros bien
    //    pero nunca se veía por esto.
    <div className="fixed inset-0 z-[200]">
      <style>{`
        #arjs-video { display: block !important; z-index: 1 !important; }
        .a-canvas { z-index: 2 !important; }
      `}</style>
      <a-scene
        embedded
        arjs="sourceType: webcam; trackingMethod: best; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        vr-mode-ui="enabled: false"
        renderer="logarithmicDepthBuffer: true;"
        style={{ width: '100%', height: '100%' }}
      >
        <a-marker
          ref={markerRef as never}
          preset={markerType ? undefined : markerPreset}
          type={markerType}
          url={markerUrl}
          emitevents="true"
        >
          <a-entity gltf-model={`url(${glbUrl})`} scale={escala} position={posicion} rotation={rotacion} />
        </a-marker>
        <a-entity camera />
      </a-scene>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-4">
        <p className="rounded-full bg-black/60 px-4 py-2 text-center text-[13px] font-semibold text-white">
          {marcadorDetectado
            ? nombre
            : `Apunta tu cámara al marcador de ${nombreRestaurante}`}
        </p>
      </div>

      {mostrarAyuda && !marcadorDetectado && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-6">
          <p className="rounded-xl bg-black/60 px-4 py-2.5 text-center text-xs text-white">
            No se detecta el marcador — verifica que haya buena luz y que se vea completo en la cámara.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-lg text-white"
      >
        ✕
      </button>
    </div>
  )
}
