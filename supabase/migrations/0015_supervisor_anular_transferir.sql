-- ============================================================
-- Fase 2, Módulo 7 — Capacidades del supervisor de sala:
-- anular un plato ya enviado a cocina y transferir una mesa
-- ============================================================
-- Decisiones de Pedro (2026-10-16), ver Registro_de_Cambios.md:
-- - Solo supervisor (y gerencia, que tiene todo lo anterior, §4.10) puede
--   anular un plato o transferir una mesa de un mesonero a otro.
-- - Se puede anular en espera, en preparación o listo; nunca entregado
--   (eso sería una devolución o un descuento, fuera del MVP por ahora).
-- - El motivo es obligatorio y queda quién y cuándo.
-- - Si ya se estaba preparando o estaba listo, los ingredientes de la
--   receta se registran como merma (ya se usaron). En espera, no.
-- - Cocina lo ve tachado hasta que confirma ("Entendido").
-- - Lo anulado no se cobra ni cuenta como venta.
--
-- Las reglas viven en triggers y no solo en la pantalla: RLS deja a
-- cualquier usuario de la sede escribir pedidos_items y sesiones_mesa, y
-- la app escribe offline vía PowerSync, así que la base es la barrera
-- real (CLAUDE.md). Las violaciones se lanzan con errcode P0001; el
-- conector de PowerSync descarta esos cambios en vez de trabar la cola.

-- ------------------------------------------------------------
-- 1. Estado 'anulado' y sus datos
-- ------------------------------------------------------------
alter table public.pedidos_items drop constraint pedidos_items_estado_check;
alter table public.pedidos_items add constraint pedidos_items_estado_check
  check (estado in ('por_aprobar', 'pendiente', 'en_preparacion', 'listo', 'entregado', 'anulado'));

alter table public.pedidos_items
  add column anulado_por uuid references public.usuarios(id),
  add column anulado_en timestamptz,
  add column motivo_anulacion text,
  -- En qué estado estaba al anularse: cocina lo muestra tachado en ese
  -- ticket, y define si hubo merma
  add column anulado_desde text,
  -- Cuándo cocina confirmó que vio la anulación; hasta entonces sigue
  -- tachado en el tablero
  add column anulacion_vista_en timestamptz;

-- ------------------------------------------------------------
-- 2. Validar la anulación
-- ------------------------------------------------------------
-- auth.uid() nulo = operación del servidor (SQL Editor, funciones
-- security definer): no se le exige rol.
create or replace function public.validar_anulacion_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.estado = 'anulado' then
    if new.estado <> 'anulado' then
      raise exception 'Un plato anulado no puede volver a otro estado' using errcode = 'P0001';
    end if;
    return new;
  end if;

  if new.estado = 'anulado' then
    if auth.uid() is not null and coalesce(public.current_rol(), '') not in ('supervisor', 'gerencia') then
      raise exception 'Solo un supervisor puede anular un plato' using errcode = 'P0001';
    end if;
    if old.estado not in ('pendiente', 'en_preparacion', 'listo') then
      raise exception 'No se puede anular un plato en estado %', old.estado using errcode = 'P0001';
    end if;
    if coalesce(btrim(new.motivo_anulacion), '') = '' then
      raise exception 'Anular un plato requiere un motivo' using errcode = 'P0001';
    end if;

    -- Quién y desde qué estado los pone el servidor, no el dispositivo
    new.anulado_por := coalesce(auth.uid(), new.anulado_por);
    new.anulado_en := coalesce(new.anulado_en, now());
    new.anulado_desde := old.estado;
    new.anulacion_vista_en := null;
  end if;

  return new;
end;
$$;

drop trigger if exists pedidos_items_validar_anulacion on public.pedidos_items;
create trigger pedidos_items_validar_anulacion
  before update on public.pedidos_items
  for each row execute function public.validar_anulacion_item();

-- ------------------------------------------------------------
-- 3. Descontar una receta: compartido por la entrega (salida) y por la
--    anulación de algo ya preparado (merma)
-- ------------------------------------------------------------
-- Mismo cuerpo que descontar_inventario_por_entrega (0008), extraído para
-- no duplicarlo: los insumos 'estimado' no se descuentan, los 'por_lote'
-- salen del lote abierto que vence primero.
create or replace function public.descontar_receta_de_item(
  p_item public.pedidos_items,
  p_tipo text,
  p_referencia text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_lote record;
  v_restante numeric(12,3);
  v_a_descontar numeric(12,3);
begin
  for r in
    select rec.insumo_id, rec.cantidad_requerida * p_item.cantidad as cantidad_requerida, i.tipo
    from recetas rec
    join insumos i on i.id = rec.insumo_id
    where rec.menu_item_id = p_item.menu_item_id
  loop
    if r.tipo = 'estimado' then
      continue;
    end if;

    v_a_descontar := r.cantidad_requerida;

    update inventario_sede
       set cantidad_actual = cantidad_actual - v_a_descontar
     where sede_id = p_item.sede_id and insumo_id = r.insumo_id;

    if r.tipo = 'por_lote' then
      select id, cantidad_restante into v_lote
      from lotes_insumo
      where sede_id = p_item.sede_id and insumo_id = r.insumo_id
        and cerrado_en is null and cantidad_restante > 0
      order by fecha_vencimiento is null, fecha_vencimiento asc, abierto_en asc
      limit 1;

      if v_lote.id is not null then
        v_restante := greatest(0, v_lote.cantidad_restante - v_a_descontar);
        update lotes_insumo
           set cantidad_restante = v_restante,
               cerrado_en = case when v_restante = 0 then now() else cerrado_en end
         where id = v_lote.id;
      end if;
    end if;

    insert into movimientos_inventario (tenant_id, sede_id, insumo_id, tipo, cantidad, referencia, fecha)
    values (p_item.tenant_id, p_item.sede_id, r.insumo_id, p_tipo, v_a_descontar, p_referencia, now());
  end loop;
end;
$$;

revoke all on function public.descontar_receta_de_item(public.pedidos_items, text, text) from public, anon, authenticated;

-- La entrega sigue igual que en 0008, ahora con la función compartida
create or replace function public.descontar_inventario_por_entrega()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'entregado' and old.estado is distinct from 'entregado' then
    perform public.descontar_receta_de_item(new, 'salida', 'Pedido ' || new.id);
  end if;
  return new;
end;
$$;

-- Anular algo que ya se estaba preparando o estaba listo: los
-- ingredientes ya se usaron, entran como merma
create or replace function public.merma_por_anulacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'anulado' and old.estado in ('en_preparacion', 'listo') then
    perform public.descontar_receta_de_item(new, 'merma', 'Anulado ' || new.id || ': ' || new.motivo_anulacion);
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_items_merma_por_anulacion on public.pedidos_items;
create trigger pedidos_items_merma_por_anulacion
  after update on public.pedidos_items
  for each row execute function public.merma_por_anulacion();

-- ------------------------------------------------------------
-- 4. Transferir una mesa a otro mesonero
-- ------------------------------------------------------------
-- Tomar una mesa sin mesonero (QR sin atender, aprobar su pedido) sigue
-- siendo de cualquiera. Cambiar el mesonero de una mesa que ya tiene uno
-- es transferirla, y eso es del supervisor. El nuevo mesonero tiene que
-- ser del mismo restaurante.
create or replace function public.validar_transferencia_mesa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.mesonero_id is not null and new.mesonero_id is distinct from old.mesonero_id then
    if auth.uid() is not null and coalesce(public.current_rol(), '') not in ('supervisor', 'gerencia') then
      raise exception 'Solo un supervisor puede transferir una mesa' using errcode = 'P0001';
    end if;
    if new.mesonero_id is null then
      raise exception 'Una mesa transferida tiene que quedar con un mesonero' using errcode = 'P0001';
    end if;
    if not exists (
      select 1 from usuarios u
      where u.id = new.mesonero_id and u.tenant_id = new.tenant_id
        and u.rol in ('mesonero', 'supervisor', 'gerencia')
    ) then
      raise exception 'El nuevo mesonero no es válido para esta mesa' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sesiones_mesa_validar_transferencia on public.sesiones_mesa;
create trigger sesiones_mesa_validar_transferencia
  before update on public.sesiones_mesa
  for each row execute function public.validar_transferencia_mesa();

-- ------------------------------------------------------------
-- 5. Lo anulado no se cobra ni cuenta como venta
-- ------------------------------------------------------------
-- Mismas funciones que en 0010, 0012 y 0006. El único cambio en cada una
-- es excluir 'anulado'.

create or replace function public.kpis_ventas(
  p_desde timestamptz,
  p_hasta timestamptz,
  p_sede_id uuid default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with cuentas as (
    select
      sm.id as sesion_id,
      sm.sede_id,
      sm.mesonero_id,
      sm.cerrada_en at time zone se.zona_horaria as cerrada_local,
      pc.monto,
      pc.propina,
      pc.metodo_de_pago
    from sesiones_mesa sm
    join pagos_cierre pc on pc.sesion_id = sm.id
    join sedes se on se.id = sm.sede_id
    where sm.estado = 'cerrada'
      and sm.cerrada_en >= p_desde
      and sm.cerrada_en < p_hasta
      and (p_sede_id is null or sm.sede_id = p_sede_id)
  ),
  items as (
    select
      pi.menu_item_id,
      pi.cantidad,
      pi.cantidad * pi.precio_unitario as importe
    from pedidos_items pi
    where pi.sesion_id in (select sesion_id from cuentas)
      and pi.estado not in ('por_aprobar', 'anulado')
  )
  select jsonb_build_object(
    'resumen', (
      select jsonb_build_object(
        'ventas', coalesce(sum(monto), 0),
        'propinas', coalesce(sum(propina), 0),
        'cuentas', count(distinct sesion_id),
        'ticket_promedio', case when count(distinct sesion_id) = 0 then 0
                                else round(sum(monto) / count(distinct sesion_id), 2) end
      )
      from cuentas
    ),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', dia, 'ventas', ventas, 'cuentas', n) order by dia)
      from (
        select cerrada_local::date as dia, sum(monto) as ventas, count(distinct sesion_id) as n
        from cuentas group by 1
      ) d
    ), '[]'::jsonb),
    'por_hora', coalesce((
      select jsonb_agg(jsonb_build_object('hora', hora, 'ventas', ventas, 'cuentas', n) order by hora)
      from (
        select extract(hour from cerrada_local)::int as hora, sum(monto) as ventas, count(distinct sesion_id) as n
        from cuentas group by 1
      ) h
    ), '[]'::jsonb),
    'por_metodo', coalesce((
      select jsonb_agg(jsonb_build_object('metodo', metodo_de_pago, 'ventas', ventas, 'cuentas', n) order by ventas desc)
      from (
        select metodo_de_pago, sum(monto) as ventas, count(distinct sesion_id) as n
        from cuentas group by 1
      ) m
    ), '[]'::jsonb),
    'por_mesonero', coalesce((
      select jsonb_agg(jsonb_build_object('mesonero', nombre, 'ventas', ventas, 'cuentas', n) order by ventas desc)
      from (
        select coalesce(u.nombre, 'Sin mesonero') as nombre, sum(c.monto) as ventas, count(distinct c.sesion_id) as n
        from cuentas c
        left join usuarios u on u.id = c.mesonero_id
        group by 1
      ) x
    ), '[]'::jsonb),
    'top_platos', coalesce((
      select jsonb_agg(jsonb_build_object('plato', nombre, 'cantidad', cantidad, 'importe', importe) order by cantidad desc, importe desc)
      from (
        select mi.nombre, sum(i.cantidad) as cantidad, sum(i.importe) as importe
        from items i
        join menu_items mi on mi.id = i.menu_item_id
        group by mi.nombre
        order by sum(i.cantidad) desc, sum(i.importe) desc
        limit 10
      ) p
    ), '[]'::jsonb),
    'por_categoria', coalesce((
      select jsonb_agg(jsonb_build_object('categoria', nombre, 'cantidad', cantidad, 'importe', importe) order by importe desc)
      from (
        select c.nombre, sum(i.cantidad) as cantidad, sum(i.importe) as importe
        from items i
        join menu_items mi on mi.id = i.menu_item_id
        join categorias_menu c on c.id = mi.categoria_id
        group by c.nombre
      ) k
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.kpis_ventas(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.kpis_ventas(timestamptz, timestamptz, uuid) to authenticated;

create or replace function public.kpis_rentabilidad(
  p_desde timestamptz,
  p_hasta timestamptz,
  p_sede_id uuid default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with costos as (
    select distinct on (insumo_id) insumo_id, costo_unitario
    from costo_insumo_actual
    where p_sede_id is null or sede_id = p_sede_id
    order by insumo_id, comprado_en desc
  ),
  costo_receta as (
    select
      r.menu_item_id,
      sum(r.cantidad_requerida * c.costo_unitario) as costo,
      count(*) as insumos,
      count(c.costo_unitario) as insumos_con_costo
    from recetas r
    left join costos c on c.insumo_id = r.insumo_id
    group by r.menu_item_id
  ),
  cuentas as (
    select sm.id
    from sesiones_mesa sm
    where sm.estado = 'cerrada'
      and sm.cerrada_en >= p_desde
      and sm.cerrada_en < p_hasta
      and (p_sede_id is null or sm.sede_id = p_sede_id)
      and exists (select 1 from pagos_cierre pc where pc.sesion_id = sm.id)
  ),
  vendidos as (
    select
      pi.menu_item_id,
      sum(pi.cantidad) as cantidad,
      sum(pi.cantidad * pi.precio_unitario) as importe
    from pedidos_items pi
    where pi.sesion_id in (select id from cuentas)
      and pi.estado not in ('por_aprobar', 'anulado')
    group by pi.menu_item_id
  ),
  filas as (
    select
      mi.id,
      mi.nombre,
      v.cantidad,
      v.importe,
      cr.costo,
      case
        when cr.menu_item_id is null then 'sin_receta'
        when cr.insumos_con_costo < cr.insumos then 'incompleto'
        else 'ok'
      end as estado
    from vendidos v
    join menu_items mi on mi.id = v.menu_item_id
    left join costo_receta cr on cr.menu_item_id = v.menu_item_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'menu_item_id', id,
    'plato', nombre,
    'vendidos', cantidad,
    'importe', round(importe, 2),
    'precio_promedio', round(importe / cantidad, 2),
    -- costo parcial en 'incompleto', para mostrarlo marcado como tal
    'costo_unitario', round(costo, 2),
    'estado', estado,
    'margen_unitario', case when estado = 'ok' then round(importe / cantidad - costo, 2) end,
    'margen_pct', case when estado = 'ok' and importe > 0 then round((importe - costo * cantidad) / importe * 100, 1) end,
    'ganancia', case when estado = 'ok' then round(importe - costo * cantidad, 2) end
  ) order by nombre), '[]'::jsonb)
  from filas
$$;

revoke all on function public.kpis_rentabilidad(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.kpis_rentabilidad(timestamptz, timestamptz, uuid) to authenticated;

-- El cliente (QR) deja de ver lo anulado: no está en su cuenta
create or replace function public.pedido_publico_mesa(p_mesa_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with mesa as (
    select m.id
    from mesas m
    join tenants t on t.id = m.tenant_id
    where m.id = p_mesa_id and t.estado = 'activo'
  ),
  sesion as (
    select s.id
    from sesiones_mesa s
    join mesa on mesa.id = s.mesa_id
    where s.estado = 'abierta'
    order by s.abierta_en desc
    limit 1
  )
  select jsonb_build_object(
    'sesion_abierta', exists (select 1 from sesion),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pi.id,
        'nombre', mi.nombre,
        'cantidad', pi.cantidad,
        'precio_unitario', pi.precio_unitario,
        'notas', pi.notas,
        'estado', pi.estado,
        -- agregado_por nulo = lo pidió el cliente por QR (0002/0004)
        'por_qr', pi.agregado_por is null
      ) order by pi.creado_en)
      from pedidos_items pi
      join menu_items mi on mi.id = pi.menu_item_id
      where pi.sesion_id = (select id from sesion)
        and pi.estado <> 'anulado'
    ), '[]'::jsonb)
  )
  from mesa
$$;

revoke all on function public.pedido_publico_mesa(uuid) from public;
grant execute on function public.pedido_publico_mesa(uuid) to anon, authenticated;
