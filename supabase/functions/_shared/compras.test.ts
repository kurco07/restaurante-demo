// Pruebas de la validación de sugerencias de compra (sin red ni IA).
// Correr con: node --test supabase/functions/_shared/compras.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarSugerencia, candidatosAComprar, MARGEN_IA, peticionCompra, type CandidatoCompra } from './compras.ts'

function candidato(insumo: string, extra: Partial<CandidatoCompra> = {}): CandidatoCompra {
  return {
    insumo_id: `id-${insumo}`,
    insumo,
    unidad: 'kg',
    stock: 2,
    minimo: 0,
    consumo_diario: 1,
    dias_alcanza: 2,
    pedido_pendiente: 0,
    cantidad_base: 5,
    proveedor_id: 'prov-1',
    proveedor: 'Distribuidora',
    costo_estimado: 3,
    ...extra,
  }
}

const CARNE = candidato('Carne', { cantidad_base: 10, dias_alcanza: 1 })
const PAN = candidato('Pan', { unidad: 'unidad', cantidad_base: 40, dias_alcanza: 5 })
const QUESO = candidato('Queso', { cantidad_base: 2, dias_alcanza: 9 })

test('solo se sugieren los insumos con cantidad base mayor a 0', () => {
  const lista = candidatosAComprar([CARNE, candidato('Sal', { cantidad_base: 0 }), PAN])
  assert.deepEqual(
    lista.map((c) => c.insumo),
    ['Carne', 'Pan'],
  )
})

test('la petición lleva refs cortas y solo cifras (sin ids ni proveedores)', () => {
  const p = peticionCompra([CARNE, PAN], 7)
  assert.ok(p.mensaje.includes('"ref":"i1"') && p.mensaje.includes('"ref":"i2"'))
  assert.ok(!p.mensaje.includes('id-Carne'))
  assert.ok(!p.mensaje.includes('Distribuidora'))
  assert.ok(p.instrucciones.includes(`${MARGEN_IA} veces`))
})

test('respuesta válida: usa la cantidad, prioridad y motivo de la IA, ordenado por prioridad', () => {
  const s = armarSugerencia(
    [PAN, CARNE],
    {
      resumen: 'Reponer carne urgente.',
      items: [
        { ref: 'i1', cantidad: 40, prioridad: 'media', motivo: 'Alcanza 5 días.' },
        { ref: 'i2', cantidad: 12, prioridad: 'alta', motivo: 'Se acaba mañana.' },
      ],
    },
    7,
  )
  assert.equal(s.resumen, 'Reponer carne urgente.')
  assert.deepEqual(
    s.items.map((i) => [i.insumo, i.cantidad, i.prioridad, i.revisado_por_ia]),
    [
      ['Carne', 12, 'alta', true],
      ['Pan', 40, 'media', true],
    ],
  )
})

test('cantidades fuera del margen se recortan: nunca negativas ni más de 1,5× la base', () => {
  const s = armarSugerencia(
    [CARNE, PAN],
    {
      items: [
        { ref: 'i1', cantidad: 500, prioridad: 'alta', motivo: 'x' },
        { ref: 'i2', cantidad: -3, prioridad: 'baja', motivo: 'y' },
      ],
    },
    7,
  )
  const carne = s.items.find((i) => i.insumo === 'Carne')!
  const pan = s.items.find((i) => i.insumo === 'Pan')!
  assert.equal(carne.cantidad, 15) // 10 × 1,5
  assert.equal(pan.cantidad, 0) // la IA puede sugerir no comprar
})

test('redondeo: entero para unidades, un decimal para el resto', () => {
  const s = armarSugerencia(
    [CARNE, PAN],
    {
      items: [
        { ref: 'i1', cantidad: 10.234, prioridad: 'alta', motivo: 'x' },
        { ref: 'i2', cantidad: 40.2, prioridad: 'media', motivo: 'y' },
      ],
    },
    7,
  )
  assert.equal(s.items.find((i) => i.insumo === 'Carne')!.cantidad, 10.3)
  assert.equal(s.items.find((i) => i.insumo === 'Pan')!.cantidad, 41)
})

test('insumos inventados o repetidos se ignoran; los que la IA saltea quedan con la base', () => {
  const s = armarSugerencia(
    [CARNE, PAN, QUESO],
    {
      items: [
        { ref: 'i99', cantidad: 3, prioridad: 'alta', motivo: 'inventado' },
        { ref: 'i1', cantidad: 11, prioridad: 'alta', motivo: 'primera' },
        { ref: 'i1', cantidad: 1, prioridad: 'baja', motivo: 'repetida' },
      ],
    },
    7,
  )
  assert.equal(s.items.length, 3)
  const carne = s.items.find((i) => i.insumo === 'Carne')!
  assert.equal(carne.cantidad, 11)
  assert.equal(carne.motivo, 'primera')

  const queso = s.items.find((i) => i.insumo === 'Queso')!
  assert.equal(queso.cantidad, 2)
  assert.equal(queso.revisado_por_ia, false)
  assert.equal(queso.prioridad, 'baja') // alcanza 9 días > 7
})

test('respuesta basura o vacía: todo queda con los números calculados', () => {
  for (const basura of [null, 'hola', { items: 'no' }, { items: [{ ref: 'i1', cantidad: 'mucho' }] }]) {
    const s = armarSugerencia([CARNE, PAN], basura, 7)
    assert.equal(s.items.find((i) => i.insumo === 'Carne')!.cantidad, 10)
    assert.equal(s.items.find((i) => i.insumo === 'Pan')!.cantidad, 40)
  }
})

test('prioridad inválida de la IA: se calcula por días que alcanza', () => {
  const s = armarSugerencia([CARNE], { items: [{ ref: 'i1', cantidad: 10, prioridad: 'urgentísimo', motivo: 'x' }] }, 7)
  assert.equal(s.items[0].prioridad, 'alta') // alcanza 1 día
})
