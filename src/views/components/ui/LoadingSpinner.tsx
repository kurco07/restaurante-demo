interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message = 'Cargando…' }: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
