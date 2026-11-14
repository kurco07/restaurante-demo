import {
  PowerSyncDatabase,
  Schema,
  Table,
  column,
  UpdateType,
  type CommonPowerSyncDatabase,
  type PowerSyncBackendConnector,
  type PowerSyncCredentials,
} from '@powersync/web'
import { supabase } from './supabaseClient'
import { avisar } from '../controllers/avisos/avisos'

const powerSyncUrl = import.meta.env.VITE_POWERSYNC_URL

// Índices de la base local (Fase 8, Módulo 3): las columnas por las que
// filtran las pantallas de mesonero y cocina (sede, mesa, sesión, estado).
// Sin ellos, cada consulta en vivo recorre la tabla entera, y eso se nota en
// tablets de gama baja a medida que se acumulan pedidos.
//
// Las mismas 10 tablas de la publicación `powersync` en Supabase (ver
// docs/Supabase_PowerSync_Setup_Comandos.md, Parte 6): las que necesitan
// estar disponibles offline para mesoneros, autopedido y cocina.

const sedes = new Table({
  tenant_id: column.text,
  nombre: column.text,
  direccion: column.text,
  zona_horaria: column.text,
  creado_en: column.text,
})

const usuarios = new Table({
  tenant_id: column.text,
  sede_id: column.text,
  nombre: column.text,
  contacto: column.text,
  rol: column.text,
  creado_en: column.text,
  // Sesión única por cuenta: el dispositivo cuyo token local deja de
  // coincidir con este se cierra solo (UsuarioProvider.tsx).
  sesion_token: column.text,
})

const categorias_menu = new Table({
  tenant_id: column.text,
  nombre: column.text,
  orden: column.integer,
})

const menu_items = new Table({
  tenant_id: column.text,
  categoria_id: column.text,
  nombre: column.text,
  descripcion: column.text,
  precio_base: column.real,
  imagen_url: column.text,
  modelo_ar_glb_url: column.text,
  modelo_ar_usdz_url: column.text,
})

const menu_item_sede = new Table(
  {
    tenant_id: column.text,
    menu_item_id: column.text,
    sede_id: column.text,
    disponible: column.integer,
    precio_override: column.real,
  },
  { indexes: { plato_sede: ['menu_item_id', 'sede_id'] } },
)

const mesas = new Table(
  {
    tenant_id: column.text,
    sede_id: column.text,
    nombre_numero: column.text,
    posicion_x: column.integer,
    posicion_y: column.integer,
    estado: column.text,
  },
  { indexes: { sede: ['sede_id'] } },
)

const sesiones_mesa = new Table(
  {
    tenant_id: column.text,
    sede_id: column.text,
    mesa_id: column.text,
    mesonero_id: column.text,
    estado: column.text,
    origen: column.text,
    abierta_en: column.text,
    cerrada_en: column.text,
  },
  {
    indexes: {
      mesa_estado: ['mesa_id', 'estado'],
      sede_estado: ['sede_id', 'estado'],
      mesonero_estado: ['mesonero_id', 'estado'],
    },
  },
)

const pedidos_items = new Table(
  {
    tenant_id: column.text,
    sede_id: column.text,
    sesion_id: column.text,
    menu_item_id: column.text,
    cantidad: column.integer,
    precio_unitario: column.real,
    notas: column.text,
    agregado_por: column.text,
    estado: column.text,
    client_local_id: column.text,
    sincronizado_en: column.text,
    creado_en: column.text,
    // Anulación por el supervisor (migración 0015)
    anulado_por: column.text,
    anulado_en: column.text,
    motivo_anulacion: column.text,
    anulado_desde: column.text,
    anulacion_vista_en: column.text,
  },
  { indexes: { sesion: ['sesion_id'], sede_estado: ['sede_id', 'estado'] } },
)

// Catálogo por tenant (0002): ya no guarda cantidad, eso vive en
// inventario_sede (Fase 4, todavía no sincronizada offline).
const insumos = new Table({
  tenant_id: column.text,
  nombre: column.text,
  unidad_de_medida: column.text,
  tipo: column.text,
})

const recetas = new Table(
  {
    tenant_id: column.text,
    menu_item_id: column.text,
    insumo_id: column.text,
    cantidad_requerida: column.real,
    unidad: column.text,
  },
  { indexes: { plato: ['menu_item_id'] } },
)

export const AppSchema = new Schema({
  sedes,
  usuarios,
  categorias_menu,
  menu_items,
  menu_item_sede,
  mesas,
  sesiones_mesa,
  pedidos_items,
  insumos,
  recetas,
})

export type Database = (typeof AppSchema)['types']

export const powerSync = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'plataforma-restaurantes.db',
  },
})

// Para el aviso de un cambio rechazado: qué se intentó cambiar
const QUE_CAMBIO: Record<string, string> = {
  pedidos_items: 'un cambio en un plato',
  sesiones_mesa: 'un cambio en una mesa',
  mesas: 'un cambio en una mesa',
}

// Autentica contra la instancia de PowerSync con el mismo access token de
// Supabase Auth, y sube los cambios locales pendientes de vuelta a Supabase.
class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!data.session) return null

    return {
      endpoint: powerSyncUrl,
      token: data.session.access_token,
    }
  }

  async uploadData(database: CommonPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction()
    if (!transaction) return

    for (const op of transaction.crud) {
      const table = supabase.from(op.table)
      try {
        switch (op.op) {
          case UpdateType.PUT:
            await table.upsert({ ...op.opData, id: op.id }).throwOnError()
            break
          case UpdateType.PATCH:
            await table.update(op.opData ?? {}).eq('id', op.id).throwOnError()
            break
          case UpdateType.DELETE:
            await table.delete().eq('id', op.id).throwOnError()
            break
        }
      } catch (error) {
        // Una regla de negocio de la base rechazó el cambio (triggers con
        // errcode P0001, p. ej. anular un plato que ya se entregó mientras
        // el supervisor estaba sin conexión) o la RLS lo rechazó por
        // permisos (42501, p. ej. el rol de quien hizo el cambio offline ya
        // no tiene acceso a esa fila cuando vuelve la conexión). En los dos
        // casos reintentarlo nunca va a funcionar — y si no se descarta,
        // PowerSync reintenta este MISMO ítem para siempre (es FIFO: nunca
        // llega a los cambios más nuevos de la cola), dejando ese
        // dispositivo sin poder subir nada más, en silencio. Se descarta:
        // la próxima sincronización trae lo que quedó en el servidor.
        // Cualquier otro error (red, etc.) sí se reintenta.
        // Fase 8, Módulo 2: el usuario se entera con un aviso fijo y el
        // motivo (los mensajes de nuestras reglas ya están en español).
        const codigo = (error as { code?: string }).code
        if (codigo === 'P0001' || codigo === '42501') {
          console.warn('[PowerSync] cambio rechazado por la base, se descarta:', op.table, op.id, error)
          avisar.error(error, `El servidor no aceptó ${QUE_CAMBIO[op.table] ?? 'un cambio'} hecho en este dispositivo`, {
            fijo: true,
          })
          continue
        }
        throw error
      }
    }

    await transaction.complete()
  }
}

// Solo conecta si ya está configurada la URL de la instancia (ver
// .env.example y docs/Supabase_PowerSync_Setup_Comandos.md, Parte 6).
// fetchCredentials se reintenta automáticamente, así que no hace falta
// esperar a que haya sesión iniciada para llamar a connect().
if (powerSyncUrl) {
  void powerSync.connect(new SupabaseConnector())
}
