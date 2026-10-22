-- ============================================================
-- DATOS DE DEMOSTRACIÓN — una segunda sede con 30 días de historia
-- ============================================================
-- NO es una migración: no cambia el esquema y NO debe correrse en la
-- base de un restaurante real. Sirve para probar la vista multi-sede de
-- gerencia (Fase 5, Módulo 3): el selector de sede y la página "Sedes".
--
-- Requiere haber corrido antes demo_recetas.sql (usa sus insumos, costos
-- y recetas). Cómo usarlo: pegarlo en el SQL Editor de Supabase y
-- ejecutarlo una vez. Para deshacerlo: demo_segunda_sede_borrar.sql.
--
-- Qué crea en el tenant "Restaurante prueba":
-- - La sede "Demo · Sede Norte" con 10 mesas (N1…N10).
-- - Ventas de los últimos 30 días (sin hoy) en las DOS sedes, para que la
--   comparación tenga sentido: la sede original vende algo más que la
--   nueva, y los fines de semana más que entre semana. Cada cuenta
--   cerrada lleva su pago (efectivo, tarjeta o pago móvil, a veces con
--   propina) y de vez en cuando un plato anulado con su motivo.
-- - En la Sede Norte, además, el inventario completo: dos compras
--   recibidas (precios algo más caros que en la sede original, para ver
--   que cada sede usa el costo de sus propias compras), la salida de
--   cada plato entregado según su receta, las mermas de lo anulado ya
--   preparado, y el stock que queda.
--
-- Cómo se reconoce lo generado: los platos llevan la nota
-- "Demo · venta generada", y la sede, su proveedor y sus mesas empiezan
-- con "Demo · " o son de esa sede. En la sede original las ventas demo NO
-- tocan el inventario (para no alterar su stock real de pruebas).
--
-- Sin usuarios nuevos: crear cuentas de Auth desde SQL no es buena idea.
-- Las mesas de la Sede Norte quedan "Sin mesonero" y los cobros a nombre
-- del usuario de gerencia.

do $$
declare
  v_tenant uuid;
  v_sede1 uuid;
  v_sede2 uuid;
  v_tz text;
  v_gerente uuid;
  v_hoy date;
  v_mesas1 uuid[];
  v_mesas2 uuid[];
  v_mesoneros1 uuid[];
  v_con_receta uuid[];
  v_todos uuid[];
  v_sede uuid;
  v_dia int;
  v_n int;
  v_i int;
  v_j int;
  v_platos int;
  v_cerrada timestamptz;
  v_sesion uuid;
  v_plato uuid;
  v_monto numeric;
  v_metodo text;
  v_proveedor uuid;
  v_orden uuid;
  v_motivos text[] := array[
    'El cliente cambió de opinión', 'Se marcó por error', 'Demoró demasiado',
    'Plato equivocado', 'Cliente se retiró', 'Faltó un ingrediente'
  ];
  v_desde text[] := array['pendiente', 'pendiente', 'en_preparacion', 'listo'];
begin
  select id into v_tenant from tenants where nombre = 'Restaurante prueba';
  if v_tenant is null then
    raise exception 'No existe el tenant "Restaurante prueba" — este script es solo para la base de pruebas.';
  end if;

  if exists (select 1 from sedes where tenant_id = v_tenant and nombre = 'Demo · Sede Norte') then
    raise notice 'La sede demo ya existe; no se hace nada. Para recargarla, corre primero demo_segunda_sede_borrar.sql.';
    return;
  end if;

  if not exists (select 1 from insumos where tenant_id = v_tenant and nombre like 'Demo · %') then
    raise exception 'Faltan los datos de demo_recetas.sql (insumos y recetas). Córrelo primero.';
  end if;

  select id, zona_horaria into v_sede1, v_tz from sedes where tenant_id = v_tenant order by creado_en limit 1;
  select id into v_gerente from usuarios where tenant_id = v_tenant and rol = 'gerencia' order by creado_en limit 1;
  if v_gerente is null then
    select id into v_gerente from usuarios where tenant_id = v_tenant order by creado_en limit 1;
  end if;
  v_hoy := (now() at time zone v_tz)::date;

  -- ------------------------------------------------------------
  -- La sede y sus mesas
  -- ------------------------------------------------------------
  insert into sedes (tenant_id, nombre, direccion, zona_horaria)
  values (v_tenant, 'Demo · Sede Norte', 'Datos de demostración', v_tz)
  returning id into v_sede2;

  insert into mesas (tenant_id, sede_id, nombre_numero, posicion_x, posicion_y, estado)
  select v_tenant, v_sede2, 'N' || g, ((g - 1) % 5) * 140 + 40, ((g - 1) / 5) * 140 + 40, 'libre'
  from generate_series(1, 10) g;

  select array_agg(id) into v_mesas1 from mesas where sede_id = v_sede1;
  select array_agg(id) into v_mesas2 from mesas where sede_id = v_sede2;
  select array_agg(id) into v_mesoneros1 from usuarios
    where tenant_id = v_tenant and sede_id = v_sede1 and rol in ('mesonero', 'supervisor');

  if v_mesas1 is null then
    raise exception 'La sede original no tiene mesas: no hay dónde cargar sus ventas demo.';
  end if;

  -- Platos para las ventas: casi siempre uno con receta (para que haya
  -- margen e inventario), a veces cualquiera del menú
  select array_agg(distinct mi.id) into v_con_receta
  from menu_items mi join recetas r on r.menu_item_id = mi.id
  where mi.tenant_id = v_tenant and mi.nombre not ilike 'prueba%';
  select array_agg(id) into v_todos
  from menu_items where tenant_id = v_tenant and nombre not ilike 'prueba%' and precio_base > 0;

  -- ------------------------------------------------------------
  -- Ventas de los últimos 30 días en las dos sedes
  -- ------------------------------------------------------------
  for v_dia in 1..30 loop
    foreach v_sede in array array[v_sede1, v_sede2] loop
      v_n := case when v_sede = v_sede1 then 9 + floor(random() * 8) else 6 + floor(random() * 7) end;
      -- viernes y sábado se vende más
      if extract(dow from v_hoy - v_dia) in (5, 6) then
        v_n := round(v_n * 1.4);
      end if;

      for v_i in 1..v_n loop
        v_cerrada := ((v_hoy - v_dia)::timestamp
                      + make_interval(hours => 12 + floor(random() * 10)::int, mins => floor(random() * 60)::int))
                     at time zone v_tz;

        insert into sesiones_mesa (tenant_id, sede_id, mesa_id, mesonero_id, estado, origen, abierta_en, cerrada_en)
        values (
          v_tenant, v_sede,
          case when v_sede = v_sede1 then v_mesas1[1 + floor(random() * array_length(v_mesas1, 1))::int]
               else v_mesas2[1 + floor(random() * array_length(v_mesas2, 1))::int] end,
          case when v_sede = v_sede1 and v_mesoneros1 is not null
               then v_mesoneros1[1 + floor(random() * array_length(v_mesoneros1, 1))::int] end,
          'cerrada', 'mesonero', v_cerrada - interval '50 minutes', v_cerrada
        )
        returning id into v_sesion;

        v_platos := 1 + floor(random() * 4);
        for v_j in 1..v_platos loop
          v_plato := case when random() < 0.85 or v_todos is null
                          then v_con_receta[1 + floor(random() * array_length(v_con_receta, 1))::int]
                          else v_todos[1 + floor(random() * array_length(v_todos, 1))::int] end;
          insert into pedidos_items (
            tenant_id, sede_id, sesion_id, menu_item_id, cantidad, precio_unitario,
            notas, agregado_por, estado, client_local_id, sincronizado_en, creado_en
          )
          select v_tenant, v_sede, v_sesion, mi.id, case when random() < 0.2 then 2 else 1 end, mi.precio_base,
                 'Demo · venta generada', v_gerente, 'entregado', gen_random_uuid(),
                 v_cerrada - interval '40 minutes', v_cerrada - interval '45 minutes'
          from menu_items mi where mi.id = v_plato;
        end loop;

        -- Más o menos una cuenta de cada 12 tuvo un plato anulado
        if random() < 0.08 then
          v_plato := v_con_receta[1 + floor(random() * array_length(v_con_receta, 1))::int];
          insert into pedidos_items (
            tenant_id, sede_id, sesion_id, menu_item_id, cantidad, precio_unitario,
            notas, agregado_por, estado, client_local_id, sincronizado_en, creado_en,
            anulado_por, anulado_en, motivo_anulacion, anulado_desde, anulacion_vista_en
          )
          select v_tenant, v_sede, v_sesion, mi.id, 1, mi.precio_base,
                 'Demo · venta generada', v_gerente, 'anulado', gen_random_uuid(),
                 v_cerrada - interval '40 minutes', v_cerrada - interval '45 minutes',
                 v_gerente, v_cerrada - interval '30 minutes',
                 v_motivos[1 + floor(random() * array_length(v_motivos, 1))::int],
                 v_desde[1 + floor(random() * array_length(v_desde, 1))::int],
                 v_cerrada - interval '29 minutes'
          from menu_items mi where mi.id = v_plato;
        end if;

        select coalesce(sum(cantidad * precio_unitario), 0) into v_monto
        from pedidos_items where sesion_id = v_sesion and estado = 'entregado';

        v_metodo := case when random() < 0.4 then 'efectivo' when random() < 0.6 then 'tarjeta' else 'pago_movil' end;

        insert into pagos_cierre (tenant_id, sede_id, sesion_id, metodo_de_pago, monto, propina, cerrado_por)
        values (
          v_tenant, v_sede, v_sesion, v_metodo, v_monto,
          case when random() < 0.6 then round(v_monto * (0.05 + random() * 0.05)::numeric, 2) else 0 end,
          v_gerente
        );
      end loop;
    end loop;
  end loop;

  -- ------------------------------------------------------------
  -- Inventario de la Sede Norte
  -- ------------------------------------------------------------
  -- Lo que gastaron sus platos entregados (y la merma de lo anulado ya
  -- preparado), según la receta. Los insumos 'estimado' no se descuentan,
  -- igual que en el trigger de la migración 0008.
  create temp table demo_consumo on commit drop as
  select
    rec.insumo_id,
    case when pi.estado = 'entregado' then 'salida' else 'merma' end as tipo,
    rec.cantidad_requerida * pi.cantidad as cantidad,
    case when pi.estado = 'entregado' then sm.cerrada_en else pi.anulado_en end as fecha,
    case when pi.estado = 'entregado' then 'Pedido ' || pi.id
         else 'Anulado ' || pi.id || ': ' || pi.motivo_anulacion end as referencia
  from pedidos_items pi
  join sesiones_mesa sm on sm.id = pi.sesion_id
  join recetas rec on rec.menu_item_id = pi.menu_item_id
  join insumos i on i.id = rec.insumo_id
  where pi.sede_id = v_sede2
    and i.tipo <> 'estimado'
    and (pi.estado = 'entregado' or (pi.estado = 'anulado' and pi.anulado_desde in ('en_preparacion', 'listo')));

  insert into inventario_sede (tenant_id, sede_id, insumo_id, cantidad_actual)
  select v_tenant, v_sede2, i.id, 0
  from insumos i where i.tenant_id = v_tenant and i.nombre like 'Demo · %';

  insert into proveedores (tenant_id, sede_id, nombre, contacto)
  values (v_tenant, v_sede2, 'Demo · Distribuidora Norte', 'Datos de demostración')
  returning id into v_proveedor;

  -- Dos compras: hace 31 y hace 15 días, cada una con ~65% de lo que se
  -- gastó en el mes (queda stock al final). Solo de los insumos que la
  -- sede original sí compró, y algo más caros: 8% y luego 12%.
  for v_i in 1..2 loop
    insert into ordenes_compra (tenant_id, sede_id, proveedor_id, estado, creada_por, aprobada_por, creado_en)
    values (v_tenant, v_sede2, v_proveedor, 'recibida', v_gerente, v_gerente,
            ((v_hoy - case when v_i = 1 then 31 else 15 end)::timestamp + interval '9 hours') at time zone v_tz)
    returning id into v_orden;

    insert into ordenes_compra_items (tenant_id, orden_compra_id, insumo_id, cantidad, costo_estimado)
    select v_tenant, v_orden, c.insumo_id,
           greatest(1, ceil(coalesce(gasto.total, 0) * 0.65)),
           round(c.costo_unitario * case when v_i = 1 then 1.08 else 1.12 end, 2)
    from costo_insumo_actual c
    join insumos i on i.id = c.insumo_id
    left join (select insumo_id, sum(cantidad) as total from demo_consumo group by insumo_id) gasto
      on gasto.insumo_id = c.insumo_id
    where c.sede_id = v_sede1 and i.nombre like 'Demo · %';

    insert into movimientos_inventario (tenant_id, sede_id, insumo_id, tipo, cantidad, referencia, fecha)
    select v_tenant, v_sede2, oci.insumo_id, 'entrada', oci.cantidad, 'Demo · Orden de compra recibida', oc.creado_en
    from ordenes_compra_items oci join ordenes_compra oc on oc.id = oci.orden_compra_id
    where oc.id = v_orden;
  end loop;

  insert into movimientos_inventario (tenant_id, sede_id, insumo_id, tipo, cantidad, referencia, fecha)
  select v_tenant, v_sede2, insumo_id, tipo, cantidad, referencia, fecha from demo_consumo;

  -- Stock de hoy = entradas − salidas − mermas, sin bajar de cero
  update inventario_sede inv
     set cantidad_actual = greatest(0, t.neto)
    from (
      select insumo_id,
             sum(case when tipo in ('entrada', 'ajuste') then cantidad else -cantidad end) as neto
      from movimientos_inventario where sede_id = v_sede2
      group by insumo_id
    ) t
   where inv.sede_id = v_sede2 and inv.insumo_id = t.insumo_id;

  raise notice 'Listo: sede "Demo · Sede Norte" con % cuentas; % cuentas demo en la sede original.',
    (select count(*) from sesiones_mesa where sede_id = v_sede2),
    (select count(distinct pi.sesion_id) from pedidos_items pi
      where pi.sede_id = v_sede1 and pi.notas = 'Demo · venta generada');
end;
$$;
