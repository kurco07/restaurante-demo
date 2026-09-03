import { useContext } from 'react'
import { UsuarioContext } from '../components/UsuarioProvider'

export function useUsuario() {
  const context = useContext(UsuarioContext)
  if (!context) {
    throw new Error('useUsuario debe usarse dentro de un <UsuarioProvider>')
  }
  return context
}
