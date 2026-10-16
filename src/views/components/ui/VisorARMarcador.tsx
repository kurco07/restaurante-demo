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
        smooth?: string
        smoothCount?: string
        smoothTolerance?: string
        smoothThreshold?: string
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
  escala = '0.08 0.08 0.08',
  posicion = '0 0 0',
  rotacion = '0 0 0',
}: VisorARMarcadorProps) {
  const markerRef = useRef<HTMLElement>(null)
  const [marcadorDetectado, setMarcadorDetectado] = useState(false)
  const [mostrarAyuda, setMostrarAyuda] = useState(false)
  const onCerrarRef = useRef(onCerrar)
  onCerrarRef.current = onCerrar

  // Pantalla completa sobre documentElement (el <html>), NO sobre nuestro
  // propio div — AR.js inyecta su <video>/<canvas> como hijos directos de
  // <body>, fuera de este componente. Si se pone en fullscreen nuestro div,
  // el navegador oculta todo lo que no sea descendiente de él (lo manda a
  // una "capa" aparte) y la cámara, aunque sigue corriendo, deja de verse
  // — pantalla negra. Sobre documentElement, body (y sus hijos directos)
  // siguen siendo descendientes, así que se ven con normalidad.
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  // AR.js inyecta <video id="arjs-video"> y <canvas class="a-canvas">
  // como hijos directos de <body> (no de <a-scene>, que es lo único que
  // React/A-Frame sí desmontan solos) — nada los limpia automáticamente
  // al desmontar este componente, así que quedan "pegados" en pantalla
  // con la cámara todavía encendida. Se apaga el stream de la cámara y
  // se quitan los nodos a mano.
  useEffect(() => {
    return () => {
      const video = document.querySelector<HTMLVideoElement>('#arjs-video')
      if (video) {
        const stream = video.srcObject as MediaStream | null
        stream?.getTracks().forEach((track) => track.stop())
        video.remove()
      }
      document.querySelector('.a-canvas')?.remove()
    }
  }, [])

  // Cerrar de verdad significa esperar a que el navegador TERMINE de
  // salir de pantalla completa antes de desmontar — salir de fullscreen
  // es una transición animada, no algo instantáneo. Desmontar de una vez
  // (como se hacía antes) mostraba el resto de la app a mitad de esa
  // transición, con el viewport todavía sin asentar — se veía "recortado"
  // con un zoom raro. Este listener de "fullscreenchange" es el único
  // lugar que de verdad cierra (onCerrar), disparado solo cuando el
  // navegador confirma que ya salió.
  //
  // Además: en Android/Chrome es un bug conocido que, tras salir de la
  // Fullscreen API, el navegador se queda calculando el viewport con las
  // medidas de cuando estaba en pantalla completa (más ancho que la
  // pantalla real) — se veía la app "recortada" a la izquierda con un
  // hueco del color de fondo normal (#f3ede4, el que centra el contenido
  // en pantallas anchas) ocupando el resto. El truco estándar para
  // forzar que el navegador recalcule el viewport es re-aplicar el
  // <meta name="viewport"> (quitarlo y volver a ponerlo fuerza un
  // reflow completo del layout contra las medidas reales de pantalla).
  useEffect(() => {
    function refrescarViewport() {
      const meta = document.querySelector('meta[name="viewport"]')
      const contenido = meta?.getAttribute('content')
      if (!meta || !contenido) return
      meta.setAttribute('content', contenido + ', user-scalable=yes')
      requestAnimationFrame(() => meta.setAttribute('content', contenido))
    }
    function alCambiarFullscreen() {
      if (!document.fullscreenElement) {
        refrescarViewport()
        onCerrarRef.current()
      }
    }
    document.addEventListener('fullscreenchange', alCambiarFullscreen)
    return () => document.removeEventListener('fullscreenchange', alCambiarFullscreen)
  }, [])

  // El botón atrás del celular no estaba conectado a nada de esto —
  // navegaba la app por detrás mientras la cámara se quedaba pegada
  // encima. Se empuja una entrada de historial al abrir y se escucha
  // "popstate" (el botón ✕ dispara history.back(), así las dos vías
  // quedan sincronizadas). Si hay pantalla completa activa, primero hay
  // que salir de ahí — el listener de arriba se encarga de cerrar de
  // verdad una vez el navegador confirme la salida. En Android, con
  // fullscreen activo, el PRIMER botón atrás solo le avisa al navegador
  // que salga de pantalla completa (no llega a disparar "popstate" —
  // comportamiento nativo, no nuestro), pero eso también dispara el
  // mismo "fullscreenchange" de arriba, así que igual cierra bien.
  useEffect(() => {
    history.pushState({ vistaAR: true }, '')
    function alPresionarAtras() {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => onCerrarRef.current())
      } else {
        onCerrarRef.current()
      }
    }
    window.addEventListener('popstate', alPresionarAtras)
    return () => window.removeEventListener('popstate', alPresionarAtras)
  }, [])

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
    //    pero nunca se veía por esto. Por la misma razón (hijos de
    //    <body>, no de este div) un z-index bajo tampoco basta: cualquier
    //    otro modal de la app con z-index mayor (ej. el modal de
    //    "Agregar", en 50) se pinta por encima de la cámara. Se usan
    //    valores altos para ganarle a cualquier overlay existente hoy.
    <div className="fixed inset-0 z-[1001]">
      <style>{`
        /* AR.js calcula su propio tamaño de "cover" a mano: agranda el
           video más que el viewport y lo centra con margin negativo. En
           desktop ese cálculo dio bien, pero en el celular real volvió a
           dar un tamaño chico (como si no hubiera recalculado contra el
           viewport correcto en fullscreen) — dejarlo sin tocar vuelve al
           mismo "rectángulo chico" original. Y forzar solo width/height
           (intento anterior) tampoco alcanza: el margin-left/margin-top
           que AR.js ya había calculado para SU tamaño queda desalineado
           contra el nuestro y corta la imagen de lado.
           Solución: forzar tamaño Y resetear el margen a la vez, y dejar
           que object-fit: cover haga el recorte sin depender de ningún
           cálculo de márgenes de AR.js. */
        #arjs-video {
          display: block !important;
          z-index: 999 !important;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          object-fit: cover !important;
        }
        .a-canvas {
          z-index: 1000 !important;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
        }
        /* vr-mode-ui="enabled: false" no está suprimiendo el botón de
           A-Frame para "entrar en VR" — se oculta a la fuerza por CSS. */
        .a-enter-vr { display: none !important; }
      `}</style>
      <a-scene
        embedded
        // sourceWidth/sourceHeight fuerzan la resolución de captura en vez
        // de dejar que AR.js la auto-detecte del layout de la página — sin
        // esto, en el celular se detectó un tamaño de fuente absurdo
        // (444x1859, claramente mal calculado) que dejaba la cámara
        // desalineada; 640x480 es la resolución para la que ya viene
        // calibrado el archivo de cámara por defecto de ARToolkit.
        arjs="sourceType: webcam; sourceWidth: 640; sourceHeight: 480; trackingMethod: best; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
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
          smooth="true"
          smoothCount="10"
          smoothTolerance="0.01"
          smoothThreshold="5"
        >
          <a-entity gltf-model={`url(${glbUrl})`} scale={escala} position={posicion} rotation={rotacion} />
        </a-marker>
        <a-entity camera />
      </a-scene>

      {/* z-index muy alto (más que el z-index:1000 forzado arriba en
          .a-canvas): el canvas WebGL de A-Frame no crea su propio
          contexto de apilamiento (no tiene position/z-index propios), así
          que su z-index "se escapa" hacia este mismo nivel en vez de
          quedar atrapado dentro de <a-scene> — con un z-index menor acá,
          el canvas terminaba ganándole al botón para efectos de clic
          (se veía encima pero no se podía presionar). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] flex justify-center p-4">
        <p className="rounded-full bg-black/60 px-4 py-2 text-center text-[13px] font-semibold text-white">
          {marcadorDetectado
            ? nombre
            : `Apunta tu cámara al marcador de ${nombreRestaurante}`}
        </p>
      </div>

      {mostrarAyuda && !marcadorDetectado && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-[1100] flex justify-center px-6">
          <p className="rounded-xl bg-black/60 px-4 py-2.5 text-center text-xs text-white">
            No se detecta el marcador — verifica que haya buena luz y que se vea completo en la cámara.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => history.back()}
        aria-label="Cerrar"
        className="absolute right-4 top-4 z-[1100] flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-lg text-white"
      >
        ✕
      </button>
    </div>
  )
}
