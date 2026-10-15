import { useRef } from 'react'
import '@google/model-viewer'

// @google/model-viewer declara el custom element para el DOM nativo
// (HTMLElementTagNameMap) pero no para JSX de React. Con el runtime
// automático de JSX (React 19) el namespace que tsc revisa es
// React.JSX, no el global JSX de las versiones viejas — por eso la
// augmentación va sobre el módulo 'react', no sobre `declare global`.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        'ios-src'?: string
        alt?: string
        ar?: boolean
        'ar-modes'?: string
        'camera-controls'?: boolean
        'auto-rotate'?: boolean
        exposure?: string
        poster?: string
      }
    }
  }
}

interface VisorARProps {
  glbUrl: string
  usdzUrl?: string | null
  nombre: string
}

interface ModelViewerElement extends HTMLElement {
  activateAR: () => Promise<void>
}

// <model-viewer> solo detecta el clic solo de SU botón interno por
// defecto (busca `.ar-button` en su shadow DOM — el slot con nuestro
// propio botón no cuenta como ese nodo, así que nunca lo ve). Por eso
// se llama activateAR() a mano en el onClick — si no, el botón se ve
// bien pero no hace nada y solo queda el visor 3D girando con el dedo,
// nunca la cámara real. Scene Viewer en Android, Quick Look en iPhone
// (si hay ios-src), sin instalar ninguna app. Necesita una URL pública
// real (no localhost): son visores del sistema operativo, abren la URL
// directo, no pueden mandar sesión.
export function VisorAR({ glbUrl, usdzUrl, nombre }: VisorARProps) {
  const visorRef = useRef<ModelViewerElement>(null)

  return (
    <model-viewer
      ref={visorRef as never}
      src={glbUrl}
      ios-src={usdzUrl ?? undefined}
      alt={nombre}
      ar
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      auto-rotate
      style={{
        width: '100%',
        height: '220px',
        display: 'block',
        borderRadius: '12px',
        background: 'var(--surface-alt, #f2efe9)',
      }}
    >
      <button
        slot="ar-button"
        type="button"
        onClick={() => visorRef.current?.activateAR()}
        className="mt-2 w-full rounded-xl bg-[var(--orange,#ff7a1a)] py-2.5 text-sm font-extrabold text-white"
      >
        Ver en RA
      </button>
    </model-viewer>
  )
}
