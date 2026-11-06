import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/powerSyncClient'
import { aplicarMarcaCacheada } from './controllers/marca/useAplicarMarca'
import App from './App.tsx'
import { ErrorBoundary } from './views/components/ErrorBoundary'

// Antes de que React pinte nada, ya deja puesto el último color de marca
// conocido (si lo hay) — evita el parpadeo del color por defecto mientras
// se resuelve la sesión/el fetch real (Fase 7, Módulo 4).
aplicarMarcaCacheada()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary nombre="app">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
