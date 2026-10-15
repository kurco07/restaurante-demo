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

// <model-viewer> ya trae su botón de RA nativo con `ar` — Scene Viewer
// en Android, Quick Look en iPhone, sin instalar ninguna app. El botón
// de aquí va en el slot "ar-button" para que se vea igual al resto de
// los botones del proyecto, en vez del ícono genérico. Necesita una URL
// pública real (no localhost): Quick Look/Scene Viewer son visores del
// sistema operativo, abren la URL directo, no pueden mandar sesión.
export function VisorAR({ glbUrl, usdzUrl, nombre }: VisorARProps) {
  return (
    <model-viewer
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
        className="mt-2 w-full rounded-xl bg-[var(--orange,#ff7a1a)] py-2.5 text-sm font-extrabold text-white"
      >
        Ver en RA
      </button>
    </model-viewer>
  )
}
