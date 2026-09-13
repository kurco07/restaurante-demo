import type { ReactNode } from 'react'

interface PageLayoutProps {
  title: string
  children?: ReactNode
}

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {children}
    </div>
  )
}
