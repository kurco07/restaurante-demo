import type { InsumoAdmin } from '../../../models/types'

// Datos de ejemplo (mockup-admin-insumos.html) hasta conectar Supabase/PowerSync.

export const categoriasInsumo = [
  'Carnes',
  'Lácteos',
  'Panadería',
  'Vegetales',
  'Salsas y condimentos',
  'Bebidas',
]

export const totalInsumosRegistrados = 38

export const insumos: InsumoAdmin[] = [
  { id: 'carne-res', nombre: 'Carne de res molida', iniciales: 'CA', categoria: 'Carnes', unidad: 'Kilogramos', unidadCorta: 'kg', stockActual: 18, stockMinimo: 10, costoUnitario: 4.2, proveedor: 'Carnes El Corral', activo: true, usadoEn: ['Hamburguesa doble clásica', 'Hamburguesa BBQ'] },
  { id: 'pan-hamburguesa', nombre: 'Pan para hamburguesa', iniciales: 'PA', categoria: 'Panadería', unidad: 'Unidades', unidadCorta: 'uds', stockActual: 15, stockMinimo: 30, costoUnitario: 0.35, proveedor: 'Panificadora Central', activo: true, usadoEn: ['Hamburguesa doble clásica', 'Combo pollo frito x3', 'Hamburguesa BBQ'] },
  { id: 'queso-cheddar', nombre: 'Queso cheddar', iniciales: 'QU', categoria: 'Lácteos', unidad: 'Kilogramos', unidadCorta: 'kg', stockActual: 6, stockMinimo: 8, costoUnitario: 6.8, proveedor: 'Lácteos San José', activo: true, usadoEn: ['Hamburguesa doble clásica', 'Papas cheddar bacon'] },
  { id: 'cebolla', nombre: 'Cebolla', iniciales: 'CE', categoria: 'Vegetales', unidad: 'Kilogramos', unidadCorta: 'kg', stockActual: 22, stockMinimo: 5, costoUnitario: 0.9, proveedor: 'Mercado Mayorista Vega', activo: true, usadoEn: ['Hamburguesa doble clásica'] },
  { id: 'masa-pizza', nombre: 'Masa de pizza', iniciales: 'MA', categoria: 'Panadería', unidad: 'Unidades', unidadCorta: 'uds', stockActual: 40, stockMinimo: 20, costoUnitario: 1.1, proveedor: 'Panificadora Central', activo: true, usadoEn: ['Pizza pepperoni familiar'] },
  { id: 'pepperoni', nombre: 'Pepperoni', iniciales: 'PE', categoria: 'Carnes', unidad: 'Kilogramos', unidadCorta: 'kg', stockActual: 9, stockMinimo: 5, costoUnitario: 8.5, proveedor: 'Carnes El Corral', activo: true, usadoEn: ['Pizza pepperoni familiar'] },
  { id: 'alitas', nombre: 'Alitas de pollo', iniciales: 'AL', categoria: 'Carnes', unidad: 'Kilogramos', unidadCorta: 'kg', stockActual: 25, stockMinimo: 15, costoUnitario: 3.6, proveedor: 'Avícola del Valle', activo: true, usadoEn: ['Alitas picantes BBQ'] },
  { id: 'papas-congeladas', nombre: 'Papas congeladas', iniciales: 'PC', categoria: 'Vegetales', unidad: 'Kilogramos', unidadCorta: 'kg', stockActual: 4, stockMinimo: 15, costoUnitario: 1.4, proveedor: 'Mercado Mayorista Vega', activo: true, usadoEn: ['Papas fritas clásicas', 'Papas cheddar bacon', 'Combo pollo frito x3'] },
  { id: 'salsa-bbq', nombre: 'Salsa BBQ', iniciales: 'SB', categoria: 'Salsas y condimentos', unidad: 'Litros', unidadCorta: 'l', stockActual: 12, stockMinimo: 5, costoUnitario: 3.2, proveedor: 'Distribuidora Sabores', activo: true, usadoEn: ['Alitas picantes BBQ'] },
  { id: 'salsa-especial', nombre: 'Salsa especial de la casa', iniciales: 'SE', categoria: 'Salsas y condimentos', unidad: 'Litros', unidadCorta: 'l', stockActual: 8, stockMinimo: 4, costoUnitario: 2.8, proveedor: 'Preparación interna', activo: true, usadoEn: ['Hamburguesa doble clásica', 'Wrap de pollo crispy'] },
  { id: 'gaseosa', nombre: 'Gaseosa (lata)', iniciales: 'GA', categoria: 'Bebidas', unidad: 'Unidades', unidadCorta: 'uds', stockActual: 120, stockMinimo: 60, costoUnitario: 0.55, proveedor: 'Distribuidora Beta', activo: true, usadoEn: ['Gaseosa', 'Combo pollo frito x3'] },
  { id: 'tortilla-wrap', nombre: 'Tortilla para wrap', iniciales: 'TO', categoria: 'Panadería', unidad: 'Unidades', unidadCorta: 'uds', stockActual: 30, stockMinimo: 25, costoUnitario: 0.45, proveedor: 'Panificadora Central', activo: true, usadoEn: ['Wrap de pollo crispy'] },
]
