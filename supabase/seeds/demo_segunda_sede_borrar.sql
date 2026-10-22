-- ============================================================
-- Borra los DATOS DE DEMOSTRACIÓN de demo_segunda_sede.sql
-- ============================================================
-- Deja la base como estaba antes de cargarlos:
-- - las ventas demo de la sede original (cuentas cuyos platos llevan la
--   nota "Demo · venta generada", con sus pagos)
-- - la sede "Demo · Sede Norte" con todo lo suyo: mesas, cuentas,
--   inventario, movimientos, compras y su proveedor
--
-- No toca los insumos ni las recetas de demo_recetas.sql, ni ventas
-- reales. Pegarlo en el SQL Editor de Supabase y ejecutarlo.

do $$
declare
  v_tenant uuid;
  v_sede2 uuid;
begin
  select id into v_tenant from tenants where nombre = 'Restaurante prueba';
  if v_tenant is null then
    raise exception 'No existe el tenant "Restaurante prueba".';
  end if;

  -- Cuentas demo (pedidos_items y pagos_cierre caen en cascada)
  delete from sesiones_mesa
   where tenant_id = v_tenant
     and id in (select sesion_id from pedidos_items
                 where tenant_id = v_tenant and notas = 'Demo · venta generada');

  select id into v_sede2 from sedes where tenant_id = v_tenant and nombre = 'Demo · Sede Norte';
  if v_sede2 is not null then
    -- ordenes_compra → proveedores no es en cascada: primero las órdenes
    -- (sus ítems sí caen solos), después el proveedor
    delete from ordenes_compra where sede_id = v_sede2;
    delete from proveedores where tenant_id = v_tenant and nombre = 'Demo · Distribuidora Norte';
    -- mesas, inventario_sede, movimientos y lo que quede caen con la sede
    delete from sedes where id = v_sede2;
  end if;

  raise notice 'Datos demo de la segunda sede borrados.';
end;
$$;
