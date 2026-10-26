-- ============================================================
-- Fase 6, Módulo 2 — Sugerencias de compra (+ su aprobación, Módulo 5)
-- ============================================================
-- Decisiones de Pedro (2026-10-26), ver Registro_de_Cambios.md:
-- - Las revisa y aprueba ADMINISTRACIÓN (dueña de Compras, §4.10).
-- - Aprobar crea un BORRADOR de orden por proveedor, marcado como de la
--   IA (creada_por nulo, ya previsto en 0002), que se edita y se aprueba
--   con el paso normal de Compras. La IA nunca crea una orden aprobada.
-- - Cálculo mixto: esta base calcula los números (abajo) y la IA solo
--   ajusta dentro de un margen y explica. Lo hace la Edge Function
--   ia-sugerir-compras.
-- - Se generan a mano, para cubrir 7 días.
-- - La aprobación se construye ahora (no al final de la fase) y la
--   reutilizan los Módulos 3 y 4.

-- ------------------------------------------------------------
-- 1. Cuándo se revisó cada sugerencia
-- ------------------------------------------------------------
alter table public.sugerencias_ia add column revisada_en timestamptz;

-- ------------------------------------------------------------
-- 2. Los números fijos de la sugerencia de compra
-- ------------------------------------------------------------
-- Por insumo de la sede (solo 'exacto' y 'por_lote': los 'estimado' no se
-- descuentan por receta, así que su consumo no se conoce, §5):
-- - consumo_diario: salidas + mermas de los últimos 28 días / 28
-- - stock, minimo (stock_minimo, 0 si no tiene)
-- - pedido_pendiente: lo que ya está en órdenes en borrador o aprobadas de
--   esta sede y todavía no llegó (para no pedirlo dos veces)
-- - cantidad_base = consumo_diario × p_dias + minimo − stock − pendiente,
--   sin bajar de 0, redondeada hacia arriba (entera si la unidad es
--   'unidad', a un decimal si no)
-- - dias_alcanza: stock / consumo_diario
-- - proveedor y costo de la última compra de ese insumo en la sede (el
--   costo, si nunca se compró ahí, el de cualquier sede)
-- Solo devuelve insumos con consumo o por debajo de su mínimo.
-- security invoker: RLS decide qué ve quien llama.
create or replace function public.datos_sugerencia_compra(p_sede_id uuid, p_dias integer default 7)
returns jsonb
language sql
stable
set search_path = public
as $$
  with consumo as (
    select insumo_id, sum(cantidad) as total
    from movimientos_inventario
    where sede_id = p_sede_id
      and tipo in ('salida', 'merma')
      and fecha >= now() - interval '28 days'
    group by insumo_id
  ),
  pendiente as (
    select oci.insumo_id, sum(oci.cantidad) as total
    from ordenes_compra oc
    join ordenes_compra_items oci on oci.orden_compra_id = oc.id
    where oc.sede_id = p_sede_id and oc.estado in ('borrador', 'aprobada')
    group by oci.insumo_id
  ),
  ultima_compra as (
    select distinct on (oci.insumo_id)
      oci.insumo_id, oc.proveedor_id, p.nombre as proveedor, oci.costo_estimado
    from ordenes_compra oc
    join ordenes_compra_items oci on oci.orden_compra_id = oc.id
    join proveedores p on p.id = oc.proveedor_id
    where oc.sede_id = p_sede_id and oc.estado in ('aprobada', 'recibida')
    order by oci.insumo_id, oc.creado_en desc
  ),
  costo_cualquiera as (
    select distinct on (insumo_id) insumo_id, costo_unitario
    from costo_insumo_actual
    order by insumo_id, comprado_en desc
  ),
  filas as (
    select
      i.id as insumo_id,
      i.nombre as insumo,
      i.unidad_de_medida as unidad,
      inv.cantidad_actual as stock,
      coalesce(inv.stock_minimo, 0) as minimo,
      coalesce(c.total, 0) / 28.0 as consumo_diario,
      coalesce(pe.total, 0) as pedido_pendiente,
      uc.proveedor_id,
      uc.proveedor,
      coalesce(uc.costo_estimado, cc.costo_unitario) as costo_estimado
    from inventario_sede inv
    join insumos i on i.id = inv.insumo_id
    left join consumo c on c.insumo_id = inv.insumo_id
    left join pendiente pe on pe.insumo_id = inv.insumo_id
    left join ultima_compra uc on uc.insumo_id = inv.insumo_id
    left join costo_cualquiera cc on cc.insumo_id = inv.insumo_id
    where inv.sede_id = p_sede_id
      and i.tipo in ('exacto', 'por_lote')
      and (coalesce(c.total, 0) > 0 or inv.cantidad_actual < coalesce(inv.stock_minimo, 0))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'insumo_id', insumo_id,
    'insumo', insumo,
    'unidad', unidad,
    'stock', stock,
    'minimo', minimo,
    'consumo_diario', round(consumo_diario, 3),
    'dias_alcanza', case when consumo_diario > 0 then round(greatest(stock, 0) / consumo_diario, 1) end,
    'pedido_pendiente', pedido_pendiente,
    'cantidad_base', greatest(0, case
      when unidad = 'unidad' then ceil(consumo_diario * p_dias + minimo - stock - pedido_pendiente)
      else ceil((consumo_diario * p_dias + minimo - stock - pedido_pendiente) * 10) / 10
    end),
    'proveedor_id', proveedor_id,
    'proveedor', proveedor,
    'costo_estimado', costo_estimado
  ) order by insumo), '[]'::jsonb)
  from filas
$$;

revoke all on function public.datos_sugerencia_compra(uuid, integer) from public, anon;
grant execute on function public.datos_sugerencia_compra(uuid, integer) to authenticated;

-- ------------------------------------------------------------
-- 3. Reglas de sugerencias_ia: la base es la barrera, no la pantalla
-- ------------------------------------------------------------
-- RLS deja a cualquier usuario del restaurante escribir en sugerencias_ia.
-- Estos triggers garantizan la regla de CLAUDE.md sin depender de la app:
-- - toda sugerencia nace 'pendiente' y sin revisar
-- - solo se revisa una vez (pendiente → aprobada | rechazada), y el
--   servidor anota quién y cuándo
-- - las de compra solo las revisa administración; las de los próximos
--   módulos (platos a preparar, recomendados) gerencia o administración
-- - después de revisada no cambia, y ninguna se borra (trazabilidad)
-- auth.uid() nulo = operación del servidor (SQL Editor): sin restricciones.
create or replace function public.validar_sugerencia_ia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Las sugerencias de la IA no se borran: quedan como registro' using errcode = 'P0001';
  end if;

  if tg_op = 'INSERT' then
    new.estado := 'pendiente';
    new.revisada_por := null;
    new.revisada_en := null;
    new.generada_en := now();
    return new;
  end if;

  -- UPDATE
  if old.estado <> 'pendiente' then
    raise exception 'Esta sugerencia ya fue revisada y no se puede cambiar' using errcode = 'P0001';
  end if;
  if new.tipo <> old.tipo or new.tenant_id <> old.tenant_id or new.sede_id is distinct from old.sede_id
     or new.generada_en <> old.generada_en then
    raise exception 'No se puede cambiar el origen de una sugerencia' using errcode = 'P0001';
  end if;
  if new.estado = 'pendiente' then
    raise exception 'Una sugerencia pendiente solo se puede aprobar o rechazar' using errcode = 'P0001';
  end if;
  if old.tipo = 'compra' and coalesce(public.current_rol(), '') <> 'administracion' then
    raise exception 'Solo administración puede revisar sugerencias de compra' using errcode = 'P0001';
  end if;
  if coalesce(public.current_rol(), '') not in ('administracion', 'gerencia') then
    raise exception 'Tu rol no puede revisar sugerencias de la IA' using errcode = 'P0001';
  end if;

  new.revisada_por := auth.uid();
  new.revisada_en := now();
  return new;
end;
$$;

drop trigger if exists sugerencias_ia_validar on public.sugerencias_ia;
create trigger sugerencias_ia_validar
  before insert or update or delete on public.sugerencias_ia
  for each row execute function public.validar_sugerencia_ia();

-- ------------------------------------------------------------
-- 4. Aprobar una sugerencia de compra → borradores de orden
-- ------------------------------------------------------------
-- p_items: lo que administración dejó después de revisar, [{insumo_id,
-- cantidad, proveedor_id, costo_estimado}]. Crea un borrador por
-- proveedor con creada_por nulo (= sugerida por la IA) y aprobada_por
-- nulo: la orden se sigue aprobando con el paso normal de Compras. Todo o
-- nada, en una sola transacción.
create or replace function public.aprobar_sugerencia_compra(p_sugerencia_id uuid, p_items jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_sug sugerencias_ia;
  v_proveedor uuid;
  v_orden uuid;
  v_ordenes uuid[] := '{}';
  v_invalidos integer;
begin
  if coalesce(public.current_rol(), '') <> 'administracion' then
    raise exception 'Solo administración puede aprobar sugerencias de compra' using errcode = '42501';
  end if;

  select * into v_sug from sugerencias_ia where id = p_sugerencia_id for update;
  if v_sug.id is null or v_sug.tipo <> 'compra' then
    raise exception 'No existe esa sugerencia de compra' using errcode = 'P0001';
  end if;
  if v_sug.estado <> 'pendiente' then
    raise exception 'Esta sugerencia ya fue revisada' using errcode = 'P0001';
  end if;
  if v_sug.sede_id is distinct from public.current_sede_id() then
    raise exception 'La sugerencia es de otra sede' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Marca al menos un insumo para comprar' using errcode = 'P0001';
  end if;

  -- Cantidades positivas, e insumos y proveedores de este restaurante
  select count(*) into v_invalidos
  from jsonb_array_elements(p_items) e
  where coalesce((e->>'cantidad')::numeric, 0) <= 0
     or not exists (select 1 from insumos i where i.id = (e->>'insumo_id')::uuid and i.tenant_id = v_sug.tenant_id)
     or not exists (select 1 from proveedores p where p.id = (e->>'proveedor_id')::uuid and p.tenant_id = v_sug.tenant_id);
  if v_invalidos > 0 then
    raise exception 'Cada insumo necesita una cantidad mayor a 0 y un proveedor' using errcode = 'P0001';
  end if;

  for v_proveedor in
    select distinct (e->>'proveedor_id')::uuid from jsonb_array_elements(p_items) e
  loop
    insert into ordenes_compra (tenant_id, sede_id, proveedor_id, estado, creada_por, aprobada_por)
    values (v_sug.tenant_id, v_sug.sede_id, v_proveedor, 'borrador', null, null)
    returning id into v_orden;

    insert into ordenes_compra_items (tenant_id, orden_compra_id, insumo_id, cantidad, costo_estimado)
    select v_sug.tenant_id, v_orden, (e->>'insumo_id')::uuid, (e->>'cantidad')::numeric,
           nullif(e->>'costo_estimado', '')::numeric
    from jsonb_array_elements(p_items) e
    where (e->>'proveedor_id')::uuid = v_proveedor;

    v_ordenes := v_ordenes || v_orden;
  end loop;

  update sugerencias_ia
     set estado = 'aprobada',
         contenido = contenido || jsonb_build_object(
           'aprobado', jsonb_build_object('items', p_items, 'ordenes', to_jsonb(v_ordenes))
         )
   where id = p_sugerencia_id;

  return jsonb_build_object('ordenes', to_jsonb(v_ordenes));
end;
$$;

revoke all on function public.aprobar_sugerencia_compra(uuid, jsonb) from public, anon;
grant execute on function public.aprobar_sugerencia_compra(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- 5. Rechazar una sugerencia (cualquier tipo), con motivo
-- ------------------------------------------------------------
-- El trigger de arriba decide qué rol puede rechazar qué tipo.
create or replace function public.rechazar_sugerencia_ia(p_sugerencia_id uuid, p_motivo text)
returns void
language plpgsql
set search_path = public
as $$
begin
  if coalesce(btrim(p_motivo), '') = '' then
    raise exception 'Rechazar una sugerencia requiere un motivo' using errcode = 'P0001';
  end if;

  update sugerencias_ia
     set estado = 'rechazada',
         contenido = contenido || jsonb_build_object('rechazo', jsonb_build_object('motivo', btrim(p_motivo)))
   where id = p_sugerencia_id;

  if not found then
    raise exception 'No existe esa sugerencia' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.rechazar_sugerencia_ia(uuid, text) from public, anon;
grant execute on function public.rechazar_sugerencia_ia(uuid, text) to authenticated;
