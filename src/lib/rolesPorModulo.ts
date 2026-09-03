import type { Rol } from '../types/usuario'

// Matriz de acceso por ruta de módulo, según arquitectura.md (sección 4.10).
// /autopedido queda fuera a propósito: es la vista pública del cliente por QR,
// no requiere sesión (ver arquitectura.md, sección 4.1).
export const rolesPorModulo: Record<string, Rol[]> = {
  '/mesoneros': ['mesonero', 'supervisor', 'gerencia'],
  '/cocina': ['cocina', 'supervisor', 'gerencia'],
  '/administracion': ['administracion', 'gerencia'],
  '/gerencia': ['gerencia'],
  '/super-admin': ['super_admin'],
}
