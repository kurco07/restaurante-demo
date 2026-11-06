import type { Rol } from '../models/types/usuario'

// Matriz de acceso por ruta de módulo, según arquitectura.md (sección 4.10).
// /autopedido queda fuera a propósito: es la vista pública del cliente por QR,
// no requiere sesión (ver arquitectura.md, sección 4.1).
export const rolesPorModulo: Record<string, Rol[]> = {
  '/mesoneros': ['mesonero', 'supervisor', 'gerencia'],
  '/cocina': ['cocina', 'supervisor', 'gerencia'],
  // Gerencia no entra a administración: tiene su propio panel en /gerencia
  // (decisión 2026-10-15, ver arquitectura.md §4.10).
  '/administracion': ['administracion'],
  '/gerencia': ['gerencia'],
  '/super-admin': ['super_admin'],
}

// A qué pantalla llega cada rol: al iniciar sesión, desde "Ir al inicio"
// cuando una pantalla falla y desde la página de "no encontrada".
export const inicioPorRol: Record<Rol, string> = {
  mesonero: '/mesoneros',
  cocina: '/cocina',
  supervisor: '/mesoneros',
  administracion: '/administracion',
  gerencia: '/gerencia',
  super_admin: '/super-admin',
}

// Sin sesión (o sin perfil todavía), el inicio es el login
export function inicioDe(rol: Rol | null | undefined): string {
  return (rol && inicioPorRol[rol]) || '/login'
}
