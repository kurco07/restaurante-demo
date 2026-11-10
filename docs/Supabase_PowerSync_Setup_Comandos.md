# Comandos para crear la base de datos en Supabase y dejarla lista

## Parte 0 — Lo que solo se hace desde el navegador (no tiene comando)

1. Crea una cuenta en https://supabase.com si no tienes una.
2. Crea un nuevo proyecto desde el dashboard. Elige una región cercana a donde esperas tener más restaurantes al principio — cambiar de región después implica migrar el proyecto entero.
3. Anota estos tres datos del proyecto (Settings → API y Settings → Database): la Project URL, la anon public key, y la contraseña de la base de datos que definiste al crearlo.

Todo lo demás desde aquí sí es por comando.

---

## Parte 1 — Instalar y conectar el CLI de Supabase

```bash
npm install -g supabase

supabase login

# Dentro de la carpeta del proyecto
supabase init
```

`supabase init` crea una carpeta `supabase/` en tu proyecto (o la reutiliza si ya la creaste al pegarle el prompt a OpenCode).

Conecta la carpeta local con tu proyecto ya creado en la nube. El `project-ref` lo encuentras en la URL del dashboard de tu proyecto (algo como `abcdefghijk`):

```bash
supabase link --project-ref TU_PROJECT_REF
```

Te va a pedir la contraseña de la base de datos que anotaste en la Parte 0.

---

## Parte 2 — Aplicar el esquema (las tablas que ya diseñamos)

Coloca el archivo `supabase_schema.sql` que ya generamos dentro de `supabase/migrations/`, con un nombre que empiece con fecha para que Supabase lo ordene bien, por ejemplo:

```bash
mkdir -p supabase/migrations
cp supabase_schema.sql supabase/migrations/20260829000000_esquema_inicial.sql
```

Y lo aplicas a la base de datos real:

```bash
supabase db push
```

Si prefieres no usar el CLI para este primer paso, la alternativa más simple es entrar al SQL Editor del dashboard de Supabase y pegar el contenido de `supabase_schema.sql` directamente ahí, ejecutarlo, y listo — funciona igual de bien para esta primera vez. El CLI vale la pena a partir de que empecemos a agregar cambios al esquema seguido.

---

## Parte 3 — Verificar que quedó bien

```bash
supabase db diff
```

No debería mostrar diferencias si el push salió bien. También puedes entrar al Table Editor del dashboard y confirmar que aparecen las 19 tablas.

Verifica también que la seguridad a nivel de fila quedó activada, corriendo esto en el SQL Editor:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

La columna `rowsecurity` debe decir `true` en todas.

---

## Parte 4 — Variables de entorno para conectar la app

Copia estos tres valores al archivo `.env` de tu proyecto (el `.env.example` ya lo dejó preparado el prompt de OpenCode):

```bash
VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

(La variable de PowerSync se completa en la parte 6.)

---

## Parte 5 — Crear el primer usuario de prueba

Como todavía no existe el flujo de registro self-service, crea manualmente tu primer tenant y tu primer usuario administrador para poder empezar a probar. Corre esto en el SQL Editor del dashboard:

```sql
-- 1. Crear el tenant de prueba
insert into public.tenants (nombre, slug, plan)
values ('Restaurante de Prueba', 'restaurante-prueba', 'pro')
returning id;
```

Copia el `id` que te devuelve. Después, desde Authentication → Users en el dashboard, crea un usuario manualmente con email y contraseña, y copia su `id` (UUID). Con ambos ids, corre:

```sql
-- 2. Ligar ese usuario de auth a tu tabla de usuarios, con rol de gerencia
insert into public.usuarios (id, tenant_id, nombre, rol)
values ('ID_DEL_USUARIO_DE_AUTH', 'ID_DEL_TENANT', 'Tu Nombre', 'gerencia');
```

Con esto ya puedes iniciar sesión desde la app y las políticas de seguridad van a reconocerte como parte de ese tenant.

---

## Parte 6 — Conectar PowerSync para el modo offline

Esto es aparte de Supabase — PowerSync es un servicio propio que se conecta a tu base de datos de Postgres.

1. Crea una cuenta en https://powersync.com y crea una nueva instancia desde su dashboard.

2. Cuando te pida los datos de conexión a la base de datos, usa los de tu proyecto de Supabase (Settings → Database → Connection string, en el formato de conexión directa, no el pooler).

3. PowerSync necesita su propia "publicación" de replicación lógica en Postgres, separada de la que usa el tiempo real de Supabase. Créala en el SQL Editor de Supabase:

```sql
create publication powersync for table
  public.sedes,
  public.usuarios,
  public.categorias_menu,
  public.menu_items,
  public.menu_item_sede,
  public.mesas,
  public.sesiones_mesa,
  public.pedidos_items,
  public.insumos,
  public.recetas;
```

Solo se incluyen aquí las tablas que de verdad necesitan estar disponibles sin internet — mesoneros, cocina, mesas, menú, inventario. Tablas como suscripciones, sugerencias_ia u ordenes_compra no necesitan replicarse al dispositivo, esas siempre pasan por conexión.

4. En el dashboard de PowerSync, define las reglas de sincronización (Sync Rules) en su editor. Esta es la base según nuestro modelo de tenant — ajusta el nombre de las columnas si cambia algo:

```yaml
bucket_definitions:
  # Catálogo y datos chicos: todo el restaurante
  por_tenant:
    parameters: select tenant_id from usuarios where id = token_parameters.user_id
    data:
      - select * from sedes where tenant_id = bucket.tenant_id
      - select * from usuarios where tenant_id = bucket.tenant_id
      - select * from categorias_menu where tenant_id = bucket.tenant_id
      - select * from menu_items where tenant_id = bucket.tenant_id
      - select * from menu_item_sede where tenant_id = bucket.tenant_id
      - select * from mesas where tenant_id = bucket.tenant_id
      - select * from insumos where tenant_id = bucket.tenant_id
      - select * from recetas where tenant_id = bucket.tenant_id

  # Cuentas y pedidos: solo la sede del usuario y solo lo no archivado
  # (cuentas abiertas + cerradas de los últimos 2 días, migración 0043)
  operacion_por_sede:
    parameters: select sede_id from usuarios where id = token_parameters.user_id and sede_id is not null
    data:
      - select * from sesiones_mesa where sede_id = bucket.sede_id and archivada_en is null
      - select * from pedidos_items where sede_id = bucket.sede_id and archivado_en is null

  # Usuarios sin sede fija (gerencia de una cadena): todas las sedes,
  # también solo lo no archivado
  operacion_sin_sede:
    parameters: select tenant_id from usuarios where id = token_parameters.user_id and sede_id is null
    data:
      - select * from sesiones_mesa where tenant_id = bucket.tenant_id and archivada_en is null
      - select * from pedidos_items where tenant_id = bucket.tenant_id and archivado_en is null
```

Esto hace que cada dispositivo solo descargue y sincronice los datos de su propio tenant, nunca los de otro restaurante.

**Actualizado el 2026-11-10 (Fase 8, Módulo 3):** cuentas y pedidos ya no bajan completos. Cada dispositivo recibe solo los de **su sede** y solo los **no archivados**: las cuentas abiertas y las cerradas de los últimos 2 días. La migración `0043` agrega `archivada_en`/`archivado_en` y un proceso diario con pg_cron que los marca. PowerSync no puede filtrar por fecha (no acepta `now()`), por eso se hace con esas columnas. Cuando una fila se archiva, PowerSync la borra sola de los dispositivos. El historial completo sigue en el servidor para gerencia y los reportes. **Orden para aplicarlo:** primero la migración `0043`, después estas reglas.

5. Copia la URL de tu instancia de PowerSync a la variable que faltaba en el `.env`:

```bash
VITE_POWERSYNC_URL=https://tu-instancia.powersync.journeyapps.com
```

Pendiente para cuando construyamos el módulo de pedidos: definir el esquema del lado del cliente (client-side schema) de PowerSync, que le dice a la base SQLite local qué forma tienen las tablas replicadas — eso lo hacemos junto con la lógica de sincronización, no antes.
