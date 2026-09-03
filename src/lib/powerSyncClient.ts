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

const powerSyncUrl = import.meta.env.VITE_POWERSYNC_URL

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
})

const menu_item_sede = new Table({
  tenant_id: column.text,
  menu_item_id: column.text,
  sede_id: column.text,
  disponible: column.integer,
  precio_override: column.real,
})

const mesas = new Table({
  tenant_id: column.text,
  sede_id: column.text,
  nombre_numero: column.text,
  posicion_x: column.integer,
  posicion_y: column.integer,
  estado: column.text,
})

const sesiones_mesa = new Table({
  tenant_id: column.text,
  sede_id: column.text,
  mesa_id: column.text,
  mesonero_id: column.text,
  estado: column.text,
  origen: column.text,
  abierta_en: column.text,
  cerrada_en: column.text,
})

const pedidos_items = new Table({
  tenant_id: column.text,
  sede_id: column.text,
  sesion_id: column.text,
  menu_item_id: column.text,
  cantidad: column.integer,
  notas: column.text,
  agregado_por: column.text,
  estado: column.text,
  client_local_id: column.text,
  sincronizado_en: column.text,
  creado_en: column.text,
})

const insumos = new Table({
  tenant_id: column.text,
  sede_id: column.text,
  nombre: column.text,
  unidad_de_medida: column.text,
  tipo: column.text,
  cantidad_actual: column.real,
})

const recetas = new Table({
  tenant_id: column.text,
  menu_item_id: column.text,
  insumo_id: column.text,
  cantidad_requerida: column.real,
  unidad: column.text,
})

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
