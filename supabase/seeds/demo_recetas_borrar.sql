-- ============================================================
-- Borra los DATOS DE DEMOSTRACIÓN de demo_recetas.sql
-- ============================================================
-- Deja la base como estaba antes de cargarlos: borra todo lo que lleva
-- el prefijo "Demo · " en el tenant "Restaurante prueba" — recetas,
-- insumos (con su inventario, lotes y movimientos, incluidas las salidas
-- que hayan generado los pedidos entregados mientras estaban cargados),
-- la orden de compra demo y el proveedor demo.
--
-- No toca platos, precios, ventas ni nada que no sea demo.
-- Pegarlo en el SQL Editor de Supabase y ejecutarlo.

do $$
declare
  v_tenant uuid;
begin
  select id into v_tenant from tenants where nombre = 'Restaurante prueba';
  if v_tenant is null then
    raise exception 'No existe el tenant "Restaurante prueba".';
  end if;

  -- recetas → insumos es "on delete restrict": van primero
  delete from recetas r
   using insumos i
   where i.id = r.insumo_id and i.tenant_id = v_tenant and i.nombre like 'Demo · %';

  -- la orden demo (sus ítems se borran en cascada) y su proveedor
  delete from ordenes_compra oc
   using proveedores p
   where p.id = oc.proveedor_id and p.tenant_id = v_tenant and p.nombre like 'Demo · %';
  delete from proveedores where tenant_id = v_tenant and nombre like 'Demo · %';

  -- ítems demo que alguien haya agregado a una orden real
  delete from ordenes_compra_items oci
   using insumos i
   where i.id = oci.insumo_id and i.tenant_id = v_tenant and i.nombre like 'Demo · %';

  -- inventario_sede, lotes_insumo y movimientos_inventario caen en cascada
  delete from insumos where tenant_id = v_tenant and nombre like 'Demo · %';

  raise notice 'Datos demo borrados.';
end;
$$;
