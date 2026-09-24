import type { MesaEditable } from '../../../models/types'

// El mismo salón que ve el mesonero en su mapa (src/views/modules/mesoneros/
// components/MapaMesas.tsx) — acá se configura número/zona/capacidad/forma,
// allá solo se consulta el estado. Cuando se conecte `mesas` real en
// Supabase, ambas pantallas leen la misma tabla.
export const mesasAdminMock: MesaEditable[] = [
  { numero: 1, zona: 'Salón principal', capacidad: 4, forma: 'square', estado: 'libre', activa: true, left: '14%', top: '16%' },
  { numero: 2, zona: 'Salón principal', capacidad: 4, forma: 'square', estado: 'ocupada', activa: true, left: '32%', top: '14%', tiempo: '12 min' },
  { numero: 3, zona: 'Salón principal', capacidad: 2, forma: 'round', estado: 'ocupada', activa: true, left: '50%', top: '18%', tiempo: '4 min' },
  { numero: 4, zona: 'Salón principal', capacidad: 4, forma: 'square', estado: 'ocupada', activa: true, left: '68%', top: '15%', tiempo: '8 min' },
  { numero: 5, zona: 'Salón principal', capacidad: 4, forma: 'square', estado: 'libre', activa: true, left: '16%', top: '38%' },
  { numero: 6, zona: 'Salón principal', capacidad: 4, forma: 'square', estado: 'limpiar', activa: true, left: '36%', top: '40%' },
  {
    numero: 7,
    zona: 'Salón principal',
    capacidad: 6,
    forma: 'round',
    estado: 'ocupada',
    activa: true,
    left: '56%',
    top: '38%',
    tiempo: '18 min',
    mesero: 'Valentina',
    demorada: true,
  },
  { numero: 8, zona: 'Terraza', capacidad: 4, forma: 'square', estado: 'libre', activa: true, left: '18%', top: '58%' },
  { numero: 9, zona: 'Terraza', capacidad: 2, forma: 'round', estado: 'ocupada', activa: true, left: '38%', top: '60%', status: 'cuenta' },
  { numero: 10, zona: 'Terraza', capacidad: 4, forma: 'square', estado: 'ocupada', activa: true, left: '58%', top: '58%', tiempo: '5 min' },
  { numero: 11, zona: 'Terraza', capacidad: 4, forma: 'square', estado: 'libre', activa: true, left: '17%', top: '80%' },
  { numero: 12, zona: 'Terraza', capacidad: 2, forma: 'round', estado: 'ocupada', activa: true, left: '42%', top: '82%', tiempo: '2 min' },
]
