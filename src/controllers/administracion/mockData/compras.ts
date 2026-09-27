import type { OrdenCompra } from '../../../models/types'

// Datos de ejemplo (mockup-admin-compras.html) hasta conectar Supabase.

export const resumenComprasMes = {
  ordenes: 12,
  comprometido: 1240,
}

export const ordenesCompra: OrdenCompra[] = [
  {
    id: 'oc-0142', codigo: 'OC-0142', proveedor: 'Panificadora Central', solicitadaPor: 'Daniela Roa',
    estado: 'pendiente', fecha: '07 sep', fechaSolicitud: '07/09/2026', entregaEstimada: '48 horas',
    items: [
      { insumo: 'Pan para hamburguesa', cantidad: 100, unidad: 'uds', costoUnitario: 0.35 },
      { insumo: 'Masa de pizza', cantidad: 40, unidad: 'uds', costoUnitario: 1.1 },
      { insumo: 'Tortilla para wrap', cantidad: 140, unidad: 'uds', costoUnitario: 0.45 },
    ],
  },
  {
    id: 'oc-0143', codigo: 'OC-0143', proveedor: 'Avícola del Valle', solicitadaPor: 'Daniela Roa',
    estado: 'aprobada', fecha: '07 sep', fechaSolicitud: '07/09/2026', entregaEstimada: '24 horas',
    items: [{ insumo: 'Alitas de pollo', cantidad: 25, unidad: 'kg', costoUnitario: 3.6 }],
  },
  {
    id: 'oc-0144', codigo: 'OC-0144', proveedor: 'Distribuidora Sabores', solicitadaPor: 'Carlos Méndez',
    estado: 'borrador', fecha: '08 sep', fechaSolicitud: '08/09/2026', entregaEstimada: '72 horas',
    items: [{ insumo: 'Salsa BBQ', cantidad: 12, unidad: 'l', costoUnitario: 3.2 }],
  },
  {
    id: 'oc-0141', codigo: 'OC-0141', proveedor: 'Mercado Mayorista Vega', solicitadaPor: 'Daniela Roa',
    estado: 'recibida', fecha: '02 sep', fechaSolicitud: '02/09/2026', entregaEstimada: '24 horas',
    items: [
      { insumo: 'Papas congeladas', cantidad: 30, unidad: 'kg', costoUnitario: 1.4 },
      { insumo: 'Cebolla', cantidad: 25, unidad: 'kg', costoUnitario: 0.9 },
    ],
  },
  {
    id: 'oc-0140', codigo: 'OC-0140', proveedor: 'Carnes El Corral', solicitadaPor: 'Daniela Roa',
    estado: 'recibida', fecha: '28 ago', fechaSolicitud: '28/08/2026', entregaEstimada: '24 horas',
    items: [
      { insumo: 'Carne de res molida', cantidad: 30, unidad: 'kg', costoUnitario: 4.2 },
      { insumo: 'Pepperoni', cantidad: 6, unidad: 'kg', costoUnitario: 10 },
    ],
  },
  {
    id: 'oc-0139', codigo: 'OC-0139', proveedor: 'Lácteos San José', solicitadaPor: 'Carlos Méndez',
    estado: 'rechazada', fecha: '25 ago', fechaSolicitud: '25/08/2026', entregaEstimada: '48 horas',
    items: [{ insumo: 'Queso cheddar', cantidad: 8, unidad: 'kg', costoUnitario: 6.8 }],
  },
]
