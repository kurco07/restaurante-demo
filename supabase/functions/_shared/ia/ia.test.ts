// Pruebas del adaptador de IA con un Gemini falso (sin red ni clave).
// Correr con: node --test supabase/functions/_shared/ia/ia.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ErrorIA, MODELO_GEMINI_POR_DEFECTO, obtenerProveedorIA } from './index.ts'

interface Llamada {
  url: string
  init: RequestInit
}

// fetch falso: guarda lo que se le pidió y responde lo indicado
function geminiFalso(status: number, cuerpo: unknown) {
  const llamadas: Llamada[] = []
  const fn = (async (url: string, init: RequestInit) => {
    llamadas.push({ url, init })
    return new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } })
  }) as unknown as typeof fetch
  return { fn, llamadas }
}

const PETICION = {
  instrucciones: 'Eres un asistente de compras.',
  mensaje: 'Responde ok.',
  esquema: {
    type: 'object' as const,
    properties: {
      respuesta: { type: 'string' as const },
      items: { type: 'array' as const, items: { type: 'integer' as const } },
    },
    required: ['respuesta'],
  },
}

const RESPUESTA_OK = {
  candidates: [{ content: { parts: [{ text: '{"respuesta":"ok","items":[1,2]}' }] }, finishReason: 'STOP' }],
  usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 5 },
}

async function falla(promesa: Promise<unknown>, codigo: string) {
  await assert.rejects(promesa, (e: unknown) => e instanceof ErrorIA && e.codigo === codigo)
}

test('sin clave: error no_configurada (no se llama a nadie)', () => {
  assert.throws(() => obtenerProveedorIA({}), (e: unknown) => e instanceof ErrorIA && e.codigo === 'no_configurada')
})

test('proveedor desconocido: error no_configurada', () => {
  assert.throws(
    () => obtenerProveedorIA({ IA_PROVEEDOR: 'otro', GEMINI_API_KEY: 'x' }),
    (e: unknown) => e instanceof ErrorIA && e.codigo === 'no_configurada',
  )
})

test('modelo por defecto si no se configura', () => {
  const ia = obtenerProveedorIA({ GEMINI_API_KEY: 'x' })
  assert.equal(ia.nombre, 'gemini')
  assert.equal(ia.modelo, MODELO_GEMINI_POR_DEFECTO)
})

test('respuesta correcta: devuelve el JSON, el modelo y los tokens', async () => {
  const g = geminiFalso(200, RESPUESTA_OK)
  const ia = obtenerProveedorIA({ GEMINI_API_KEY: 'clave-secreta', GEMINI_MODELO: 'modelo-x' }, g.fn)
  const r = await ia.generarJSON<{ respuesta: string; items: number[] }>(PETICION)

  assert.deepEqual(r.datos, { respuesta: 'ok', items: [1, 2] })
  assert.equal(r.modelo, 'modelo-x')
  assert.equal(r.tokensEntrada, 12)
  assert.equal(r.tokensSalida, 5)
})

test('petición: clave en encabezado (no en la URL), JSON pedido y esquema en mayúsculas', async () => {
  const g = geminiFalso(200, RESPUESTA_OK)
  const ia = obtenerProveedorIA({ GEMINI_API_KEY: 'clave-secreta', GEMINI_MODELO: 'modelo-x' }, g.fn)
  await ia.generarJSON(PETICION)

  const { url, init } = g.llamadas[0]
  assert.ok(url.endsWith('/models/modelo-x:generateContent'))
  assert.ok(!url.includes('clave-secreta'))
  assert.equal((init.headers as Record<string, string>)['x-goog-api-key'], 'clave-secreta')

  const cuerpo = JSON.parse(String(init.body))
  assert.equal(cuerpo.systemInstruction.parts[0].text, PETICION.instrucciones)
  assert.equal(cuerpo.contents[0].parts[0].text, PETICION.mensaje)
  assert.equal(cuerpo.generationConfig.responseMimeType, 'application/json')
  assert.deepEqual(cuerpo.generationConfig.responseSchema, {
    type: 'OBJECT',
    required: ['respuesta'],
    properties: {
      respuesta: { type: 'STRING' },
      items: { type: 'ARRAY', items: { type: 'INTEGER' } },
    },
  })
})

test('errores de Gemini se traducen a códigos propios', async () => {
  const casos: [number, unknown, string][] = [
    [400, { error: { message: 'API key not valid. Please pass a valid API key.' } }, 'clave_invalida'],
    [403, { error: { message: 'Permission denied' } }, 'clave_invalida'],
    [404, { error: { message: 'models/x is not found' } }, 'modelo_no_encontrado'],
    [429, { error: { message: 'Resource exhausted' } }, 'cuota_agotada'],
    [500, { error: { message: 'Internal' } }, 'desconocido'],
  ]
  for (const [status, cuerpo, codigo] of casos) {
    const g = geminiFalso(status, cuerpo)
    await falla(obtenerProveedorIA({ GEMINI_API_KEY: 'x' }, g.fn).generarJSON(PETICION), codigo)
  }
})

test('petición bloqueada o sin texto: error bloqueada', async () => {
  const bloqueada = geminiFalso(200, { promptFeedback: { blockReason: 'SAFETY' } })
  await falla(obtenerProveedorIA({ GEMINI_API_KEY: 'x' }, bloqueada.fn).generarJSON(PETICION), 'bloqueada')

  const vacia = geminiFalso(200, { candidates: [{ finishReason: 'SAFETY' }] })
  await falla(obtenerProveedorIA({ GEMINI_API_KEY: 'x' }, vacia.fn).generarJSON(PETICION), 'bloqueada')
})

test('texto que no es JSON: error respuesta_invalida', async () => {
  const g = geminiFalso(200, { candidates: [{ content: { parts: [{ text: 'hola, no soy json' }] } }] })
  await falla(obtenerProveedorIA({ GEMINI_API_KEY: 'x' }, g.fn).generarJSON(PETICION), 'respuesta_invalida')
})

test('sin red: error sin_conexion', async () => {
  const sinRed = (async () => {
    throw new TypeError('fetch failed')
  }) as unknown as typeof fetch
  await falla(obtenerProveedorIA({ GEMINI_API_KEY: 'x' }, sinRed).generarJSON(PETICION), 'sin_conexion')
})

test('listarModelos: solo los que generan texto, sin el prefijo models/, recorriendo páginas', async () => {
  const paginas = [
    {
      models: [
        { name: 'models/gemini-nuevo-flash', supportedGenerationMethods: ['generateContent', 'countTokens'] },
        { name: 'models/text-embedding-x', supportedGenerationMethods: ['embedContent'] },
      ],
      nextPageToken: 'p2',
    },
    { models: [{ name: 'models/gemini-nuevo-pro', supportedGenerationMethods: ['generateContent'] }] },
  ]
  const urls: string[] = []
  const fn = (async (url: string) => {
    urls.push(url)
    return new Response(JSON.stringify(paginas[urls.length - 1]), { status: 200 })
  }) as unknown as typeof fetch

  const modelos = await obtenerProveedorIA({ GEMINI_API_KEY: 'clave-secreta' }, fn).listarModelos()
  assert.deepEqual(modelos, ['gemini-nuevo-flash', 'gemini-nuevo-pro'])
  assert.ok(urls[1].includes('pageToken=p2'))
  assert.ok(urls.every((u) => !u.includes('clave-secreta')))
})

test('si Gemini no responde a tiempo: error tiempo_agotado (distinto de sin_conexion)', async () => {
  // fetch que solo termina cuando lo cancelan, como un servidor colgado
  const colgado = ((_url: string, init: RequestInit) =>
    new Promise((_resolver, rechazar) => {
      init.signal?.addEventListener('abort', () => rechazar(new DOMException('abortado', 'AbortError')))
    })) as unknown as typeof fetch
  await falla(obtenerProveedorIA({ GEMINI_API_KEY: 'x' }, colgado, 50).generarJSON(PETICION), 'tiempo_agotado')
})
