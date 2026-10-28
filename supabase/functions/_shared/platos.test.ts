// Pruebas de la validación de platos a preparar (sin red ni IA).
// Correr con: node --test supabase/functions/_shared/platos.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  armarSugerenciaPlatos,
  MAX_PLATOS,
  peticionPlatos,
  platosCandidatos,
  platosSinStock,
  topePorciones,
  TOPE_MINIMO,
  type DatoPlato,
} from './platos.ts'

function plato(nombre: string, extra: Partial<DatoPlato> = {}): DatoPlato {
  return {
    menu_item_id: `id-${nombre}`,
    plato: nombre,
    porciones_posibles: 30,
    insumo_limitante: 'Carne',
    ventas_esperadas: 8,
    vendidos_28d: 40,
    precio: 10,
    costo: 4,
    costo_completo: true,
    margen: 6,
    margen_pct: 60,
    por_vencer: [],
    ...extra,
  }
}

const BURGER = plato('Burger', { porciones_posibles: 12, ventas_esperadas: 9 })
const WRAP = plato('Wrap', { porciones_posibles: null, ventas_esperadas: 2 })
const SIN_STOCK = plato('Crispy', { porciones_posibles: 0, ventas_esperadas: 3, insumo_limitante: 'Corteza' })
const POCO_VENDIDO = plato('Ensalada', { porciones_posibles: 0, ventas_esperadas: 0.2 })

test('candidatos: con stock o sin límite conocido; sin stock no se ofrece', () => {
  assert.deepEqual(
    platosCandidatos([BURGER, WRAP, SIN_STOCK]).map((p) => p.plato),
    ['Burger', 'Wrap'],
  )
})

test('sin_stock: solo los que se suelen vender ese día (≥ 1), ordenados', () => {
  const otro = plato('Pizza', { porciones_posibles: 0, ventas_esperadas: 6, insumo_limitante: 'Masa' })
  assert.deepEqual(platosSinStock([SIN_STOCK, POCO_VENDIDO, otro, BURGER]), [
    { plato: 'Pizza', insumo_limitante: 'Masa', ventas_esperadas: 6 },
    { plato: 'Crispy', insumo_limitante: 'Corteza', ventas_esperadas: 3 },
  ])
})

test('tope de porciones: el menor entre lo que alcanza y el doble de lo que se vende (mínimo 10)', () => {
  assert.equal(topePorciones(BURGER), 12) // alcanza 12, ventas ×2 = 18
  assert.equal(topePorciones(plato('X', { porciones_posibles: 100, ventas_esperadas: 7 })), 14)
  assert.equal(topePorciones(WRAP), TOPE_MINIMO) // sin límite, ventas ×2 = 4 → mínimo 10
})

test('la petición lleva refs cortas, cifras y el tope; sin ids', () => {
  const p = peticionPlatos([BURGER, WRAP])
  assert.ok(p.mensaje.includes('"ref":"p1"') && p.mensaje.includes('"tope_porciones":12'))
  assert.ok(!p.mensaje.includes('id-Burger'))
})

test('respuesta válida: respeta el orden de la IA y guarda los números', () => {
  const cands = [BURGER, WRAP]
  const s = armarSugerenciaPlatos([BURGER, WRAP, SIN_STOCK], cands, {
    resumen: 'Martes de burgers.',
    items: [
      { ref: 'p2', porciones: 3, motivo: 'Sale poco pero no tiene límite.' },
      { ref: 'p1', porciones: 9, motivo: 'Es lo más vendido los martes.' },
    ],
  })
  assert.equal(s.resumen, 'Martes de burgers.')
  assert.deepEqual(
    s.items.map((i) => [i.plato, i.porciones, i.motivo]),
    [
      ['Wrap', 3, 'Sale poco pero no tiene límite.'],
      ['Burger', 9, 'Es lo más vendido los martes.'],
    ],
  )
  assert.equal(s.items[1].porciones_posibles, 12)
  assert.equal(s.sin_stock[0].plato, 'Crispy')
})

test('porciones fuera de rango: se recortan al tope, se redondean, y < 1 se descarta', () => {
  const s = armarSugerenciaPlatos([BURGER, WRAP], [BURGER, WRAP], {
    items: [
      { ref: 'p1', porciones: 500, motivo: 'a' },
      { ref: 'p2', porciones: 0, motivo: 'b' },
    ],
  })
  assert.deepEqual(
    s.items.map((i) => [i.plato, i.porciones]),
    [['Burger', 12]],
  )
  const r = armarSugerenciaPlatos([BURGER], [BURGER], { items: [{ ref: 'p1', porciones: 4.6, motivo: 'c' }] })
  assert.equal(r.items[0].porciones, 5)
})

test('platos inventados, repetidos o con porciones basura se ignoran', () => {
  const s = armarSugerenciaPlatos([BURGER, WRAP], [BURGER, WRAP], {
    items: [
      { ref: 'p9', porciones: 3, motivo: 'inventado' },
      { ref: 'p1', porciones: 5, motivo: 'primera' },
      { ref: 'p1', porciones: 2, motivo: 'repetida' },
      { ref: 'p2', porciones: 'muchas', motivo: 'basura' },
    ],
  })
  assert.deepEqual(
    s.items.map((i) => [i.plato, i.porciones, i.motivo]),
    [['Burger', 5, 'primera']],
  )
})

test(`como máximo ${MAX_PLATOS} platos`, () => {
  const muchos = Array.from({ length: 12 }, (_, i) => plato(`P${i}`))
  const s = armarSugerenciaPlatos(muchos, muchos, {
    items: muchos.map((_, i) => ({ ref: `p${i + 1}`, porciones: 2, motivo: 'x' })),
  })
  assert.equal(s.items.length, MAX_PLATOS)
})

test('respuesta vacía o basura: sin platos, pero sin_stock igual se calcula', () => {
  for (const basura of [null, 'hola', { items: 'no' }]) {
    const s = armarSugerenciaPlatos([BURGER, SIN_STOCK], [BURGER], basura)
    assert.equal(s.items.length, 0)
    assert.equal(s.sin_stock.length, 1)
  }
})
