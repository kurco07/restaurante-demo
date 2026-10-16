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
        alt?: string
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
  nombre: string
}

// Visor 3D inline (rotar con el dedo) — solo WebGL normal, sin ningún
// problema de compatibilidad. Activar la RA con cámara real ya no es
// cosa de este componente: ver VisorARMarcador.tsx (AR.js por
// marcador, no depende de ARCore/Quick Look/WebXR).
export function VisorAR({ glbUrl, nombre }: VisorARProps) {
  return (
    <model-viewer
      src={glbUrl}
      alt={nombre}
      camera-controls
      auto-rotate
      style={{
        width: '100%',
        height: '220px',
        display: 'block',
        borderRadius: '12px',
        background: 'var(--surface-alt, #f2efe9)',
      }}
    />
  )
}
