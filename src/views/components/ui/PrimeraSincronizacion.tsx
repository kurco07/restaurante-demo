// Lo que se ve en vez de "no hay nada" mientras el dispositivo baja los
// datos por primera vez (Fase 8, Módulo 2; ver useSincronizado)
export function PrimeraSincronizacion({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 py-12 text-center text-sm text-gray-500 ${className}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--orange)]" />
      <p className="font-bold text-gray-700">Sincronizando por primera vez…</p>
      <p className="max-w-xs">Los datos aparecen en cuanto terminen de bajar. Esta primera vez necesita internet.</p>
    </div>
  )
}
