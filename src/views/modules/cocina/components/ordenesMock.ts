export type EstadoOrden = 'espera' | 'prep' | 'listo' | 'tarde'

export interface ItemOrden {
  plato: string
  cantidad: number
  mod?: string
}

export interface Orden {
  id: string
  mesa: string
  mesonero: string | null
  estado: EstadoOrden
  creado: string
  tiempo: string
  items: ItemOrden[]
}

// Datos de ejemplo — boceto visual, sin funcionalidad real todavía. Se
// reemplaza por pedidos_items real vía Supabase Realtime en Fase 2 Módulo 5.
export const ordenesMock: Orden[] = [
  {
    id: '108',
    mesa: 'Mesa 5',
    mesonero: 'Carlos R.',
    estado: 'espera',
    creado: '19:11',
    tiempo: '03:28',
    items: [
      { plato: 'Pepiroof', cantidad: 1, mod: 'Extra papas' },
      { plato: 'Ración de papas', cantidad: 2 },
    ],
  },
  {
    id: '109',
    mesa: 'Mesa 11',
    mesonero: 'Sofía L.',
    estado: 'espera',
    creado: '19:14',
    tiempo: '01:10',
    items: [{ plato: 'Triroof', cantidad: 2 }],
  },
  {
    id: '106',
    mesa: 'Mesa 8',
    mesonero: 'Carlos R.',
    estado: 'prep',
    creado: '19:06',
    tiempo: '08:42',
    items: [
      { plato: 'Ahumadita', cantidad: 1, mod: 'Sin cebolla' },
      { plato: 'César crispy', cantidad: 1 },
    ],
  },
  {
    id: '107',
    mesa: 'Mesa 3',
    mesonero: 'Sofía L.',
    estado: 'prep',
    creado: '19:09',
    tiempo: '06:15',
    items: [{ plato: 'Ahumadita', cantidad: 1, mod: 'Sin cebolla' }],
  },
  {
    id: '105',
    mesa: 'Mesa 2',
    mesonero: 'Carlos R.',
    estado: 'listo',
    creado: '19:01',
    tiempo: '14:00',
    items: [{ plato: 'César crispy', cantidad: 1 }],
  },
  {
    id: '102',
    mesa: 'Mesa 7',
    mesonero: 'Valentina',
    estado: 'tarde',
    creado: '18:57',
    tiempo: '18:32',
    items: [
      { plato: '2/4 de Roof', cantidad: 2, mod: 'Sin cebolla en una' },
      { plato: 'Ración de papas', cantidad: 1 },
    ],
  },
  {
    id: '204',
    mesa: 'Para llevar',
    mesonero: null,
    estado: 'tarde',
    creado: '18:55',
    tiempo: '20:10',
    items: [{ plato: 'Salchipapas', cantidad: 3 }],
  },
]

export const etiquetaEstadoOrden: Record<EstadoOrden, string> = {
  espera: 'En espera',
  prep: 'En preparación',
  listo: 'Listo',
  tarde: 'Tarde',
}

export const accionSegunEstado: Record<EstadoOrden, string> = {
  espera: 'Iniciar preparación',
  prep: 'Marcar listo',
  listo: 'Archivar',
  tarde: 'Marcar listo (urgente)',
}
