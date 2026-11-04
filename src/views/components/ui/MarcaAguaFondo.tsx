// Personalización completa, Ronda 1 — marca de agua de fondo del
// restaurante (discreta, nunca sobre el contenido). useAplicarMarca.ts
// ya puso --marca-agua-imagen/--marca-agua-opacidad en tiempo de
// ejecución; acá solo se lee. Se monta como PRIMER hijo del contenedor
// raíz de cada layout — un elemento position:fixed pinta detrás de los
// hermanos estáticos que le siguen en el mismo orden del DOM, así que no
// hace falta envolver el resto del contenido para que quede "al fondo".
export function MarcaAguaFondo() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-repeat"
      style={{
        backgroundImage: 'var(--marca-agua-imagen, none)',
        backgroundSize: '220px',
        opacity: 'var(--marca-agua-opacidad, 0)',
      }}
    />
  )
}
