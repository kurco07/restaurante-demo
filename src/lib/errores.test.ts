import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mensajeDeError } from './errores.ts'

test('nuestras reglas (P0001) se muestran tal cual', () => {
  assert.equal(
    mensajeDeError({ code: 'P0001', message: 'No se puede anular un plato en estado entregado' }),
    'No se puede anular un plato en estado entregado',
  )
})

test('los errores técnicos de Postgres se traducen', () => {
  assert.equal(
    mensajeDeError({ code: '23505', message: 'duplicate key value violates unique constraint "x"' }),
    'Ya existe un registro con ese nombre o dato. Usa otro.',
  )
  assert.equal(
    mensajeDeError({ code: '42501', message: 'new row violates row-level security policy for table "mesas"' }),
    'No tienes permiso para hacer esto.',
  )
})

test('42501 propio (con mensaje en español) se muestra tal cual', () => {
  assert.equal(
    mensajeDeError({ code: '42501', message: 'Solo gerencia puede ver las alertas' }),
    'Solo gerencia puede ver las alertas',
  )
})

test('borrar algo en uso: mensaje de la pantalla, o el general', () => {
  const e = { code: '23503', message: 'update or delete on table "menu_items" violates foreign key constraint' }
  assert.equal(mensajeDeError(e, 'x', { enUso: 'Este plato ya tiene pedidos.' }), 'Este plato ya tiene pedidos.')
  assert.equal(mensajeDeError(e), 'No se puede: hay otros registros que dependen de este.')
})

test('error de red', () => {
  assert.match(mensajeDeError(new TypeError('Failed to fetch')), /Sin conexión/)
})

test('un técnico desconocido cae al mensaje por defecto', () => {
  assert.equal(mensajeDeError(new Error('column "x" does not exist'), 'No se pudo guardar.'), 'No se pudo guardar.')
  assert.equal(mensajeDeError(undefined, 'No se pudo guardar.'), 'No se pudo guardar.')
})
