import type { LoteInsumo } from '../../../models/types'

// Datos de ejemplo (mockup-admin-lotes.html) hasta conectar Supabase/PowerSync.
// Solo algunos insumos tienen lotes de ejemplo; el resto se muestra vacío.

export const lotesPorInsumo: Record<string, LoteInsumo[]> = {
  'pan-hamburguesa': [
    { id: 'l1', codigo: 'PAN-0912', fechaIngreso: '02 sep', fechaVencimiento: '09 sep', cantidadRestante: 6, cantidadInicial: 40, costoUnitario: 0.34, proveedor: 'Panificadora Central', estado: 'por_vencer', usarPrimero: true },
    { id: 'l2', codigo: 'PAN-0918', fechaIngreso: '06 sep', fechaVencimiento: '13 sep', cantidadRestante: 9, cantidadInicial: 30, costoUnitario: 0.36, proveedor: 'Panificadora Central', estado: 'activo', usarPrimero: false },
    { id: 'l3', codigo: 'PAN-0905', fechaIngreso: '26 ago', fechaVencimiento: '02 sep', cantidadRestante: 0, cantidadInicial: 35, costoUnitario: 0.33, proveedor: 'Panificadora Central', estado: 'agotado', usarPrimero: false },
  ],
  'carne-res': [
    { id: 'l4', codigo: 'CAR-0910', fechaIngreso: '05 sep', fechaVencimiento: '12 sep', cantidadRestante: 8, cantidadInicial: 12, costoUnitario: 4.1, proveedor: 'Carnes El Corral', estado: 'activo', usarPrimero: true },
    { id: 'l5', codigo: 'CAR-0915', fechaIngreso: '07 sep', fechaVencimiento: '14 sep', cantidadRestante: 10, cantidadInicial: 10, costoUnitario: 4.2, proveedor: 'Carnes El Corral', estado: 'activo', usarPrimero: false },
  ],
  'queso-cheddar': [
    { id: 'l6', codigo: 'QUE-0630', fechaIngreso: 'hoy', fechaVencimiento: '30 sep', cantidadRestante: 6, cantidadInicial: 8, costoUnitario: 6.8, proveedor: 'Lácteos San José', estado: 'activo', usarPrimero: true },
  ],
  'papas-congeladas': [
    { id: 'l7', codigo: 'PAP-0901', fechaIngreso: '01 sep', fechaVencimiento: '10 sep', cantidadRestante: 4, cantidadInicial: 20, costoUnitario: 1.4, proveedor: 'Mercado Mayorista Vega', estado: 'por_vencer', usarPrimero: true },
  ],
}

// Insumos que aparecen en el selector rápido de la pantalla de lotes.
export const insumosConLotes = ['pan-hamburguesa', 'carne-res', 'queso-cheddar', 'papas-congeladas', 'cebolla', 'masa-pizza']
