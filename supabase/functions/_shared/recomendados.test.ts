// Pruebas de la validación de recomendados del día (sin red ni IA).
// Correr con: node --test supabase/functions/_shared/recomendados.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  armarRecomendados,
  MAX_FRASE,
  MAX_RECOMENDADOS,
  MIN_PORCIONES,
  peticionRecomendados,
  recomendablesCandidatos,
} from './recomendados.ts'
import type { DatoPlato } from './platos.ts'

function plato(nombre: string, extra: Partial<DatoPlato> = {}): DatoPlato {
  return {
    menu_item_id: `id-${nombre}`,
    plato: nombre,
    porciones_posibles: 30,
    insumo_limitante: 'Carne',
    ventas_esperadas: 5,
    vendidos_28d: 20,
    precio: 10,
    costo: 4,
    costo_completo: true,
    margen: 6,
    margen_pct: 60,
    por_vencer: [],
    ...extra,
  }
}

const BURGER = plato('Burger', { por_vencer: [{ insumo: 'Tocineta', dias: 1 }] })
const WRAP = plato('Wrap', { porciones_posibles: null })
const POCO = plato('Crispy', { porciones_posibles: MIN_PORCIONES - 1 })

test(`candidatos: con al menos ${MIN_PORCIONES} porciones o sin límite conocido`, () => {
  assert.deepEqual(
    recomendablesCandidatos([BURGER, WRAP, POCO]).map((p) => p.plato),
    ['Burger', 'Wrap'],
  )
})

test('la petición lleva refs cortas y los números, sin ids', () => {
  const p = peticionRecomendados([BURGER, WRAP])
  assert.ok(p.mensaje.includes('"ref":"r1"') && p.mensaje.includes('Tocineta'))
  assert.ok(!p.mensaje.includes('id-Burger'))
})

test('respuesta válida: frase para el cliente y motivo para gerencia, en el orden de la IA', () => {
  const s = armarRecomendados([BURGER, WRAP], {
    resumen: 'Hoy conviene empujar las burgers.',
    items: [
      { ref: 'r2', frase: 'Un wrap fresco para el mediodía.', motivo: 'Sin límite de stock.' },
      { ref: 'r1', frase: 'Nuestra burger más pedida, jugosa y doble queso.', motivo: 'Margen 60% y tocineta por vencer.' },
    ],
  })
  assert.equal(s.resumen, 'Hoy conviene empujar las burgers.')
  assert.deepEqual(
    s.items.map((i) => [i.plato, i.frase, i.motivo]),
    [
      ['Wrap', 'Un wrap fresco para el mediodía.', 'Sin límite de stock.'],
      ['Burger', 'Nuestra burger más pedida, jugosa y doble queso.', 'Margen 60% y tocineta por vencer.'],
    ],
  )
})

test('una frase que habla de margen, costo, stock o vencimiento se reemplaza por una neutra', () => {
  for (const mala of ['Tiene el mejor margen del menú', 'Aprovecha la tocineta que vence mañana', 'Hay mucho stock', '']) {
    const s = armarRecomendados([BURGER], { items: [{ ref: 'r1', frase: mala, motivo: 'x' }] })
    assert.equal(s.items[0].frase, 'Hoy te recomendamos Burger.', mala)
  }
})

test(`frases largas se cortan a ${MAX_FRASE} caracteres`, () => {
  const s = armarRecomendados([BURGER], { items: [{ ref: 'r1', frase: 'Muy rica. '.repeat(40), motivo: 'x' }] })
  assert.ok(s.items[0].frase.length <= MAX_FRASE)
})

test('platos inventados o repetidos se ignoran', () => {
  const s = armarRecomendados([BURGER, WRAP], {
    items: [
      { ref: 'r7', frase: 'Inventado', motivo: 'x' },
      { ref: 'r1', frase: 'Primera', motivo: 'x' },
      { ref: 'r1', frase: 'Repetida', motivo: 'x' },
    ],
  })
  assert.deepEqual(
    s.items.map((i) => [i.plato, i.frase]),
    [['Burger', 'Primera']],
  )
})

test(`como máximo ${MAX_RECOMENDADOS} platos`, () => {
  const muchos = Array.from({ length: 9 }, (_, i) => plato(`P${i}`))
  const s = armarRecomendados(muchos, { items: muchos.map((_, i) => ({ ref: `r${i + 1}`, frase: 'Rico', motivo: 'x' })) })
  assert.equal(s.items.length, MAX_RECOMENDADOS)
})

test('respuesta basura: sin recomendados', () => {
  for (const basura of [null, 'hola', { items: 'no' }]) {
    assert.equal(armarRecomendados([BURGER], basura).items.length, 0)
  }
})
