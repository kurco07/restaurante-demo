-- ============================================================
-- DATOS DE DEMOSTRACIÓN — recetas, insumos y una compra ficticios
-- ============================================================
-- NO es una migración: no cambia el esquema y NO debe correrse en la
-- base de un restaurante real. Sirve para ver el dashboard de gerencia
-- (rentabilidad por plato, rotación, valor en stock) con datos parecidos
-- a los reales mientras el restaurante no carga sus recetas de verdad.
--
-- Cómo usarlo: pegarlo en el SQL Editor de Supabase y ejecutarlo una vez.
-- Para deshacerlo: supabase/seeds/demo_recetas_borrar.sql.
--
-- Qué crea, todo marcado con el prefijo "Demo · " para no confundirlo
-- con datos reales:
-- - 32 insumos (cantidades y precios aproximados, en dólares por unidad)
-- - un proveedor y UNA orden de compra 'recibida' con precio para casi
--   todos los insumos, con su entrada de inventario y su movimiento, igual
--   que si se hubiera recibido desde Administración → Compras
-- - recetas para los platos del menú del cliente piloto, deducidas de la
--   descripción de cada plato (las cantidades son inventadas)
--
-- Para que se vean los tres estados del dashboard:
-- - Costo completo: la mayoría de los platos.
-- - Costo incompleto: Cheese miel, Queso spicy y Monster crispy usan un
--   insumo que nunca se compró ("Demo · Mermelada de tocino", "Demo ·
--   Fondue de cheddar picante", "Demo · Corteza crispy").
-- - Sin receta: Marquesa de chocolate, Pie, Mixto (Filadelfia) y Plato
--   fit de pollo.
--
-- No toca platos, precios, ventas, mesas, ni el insumo "por lote" ni el
-- plato "prueba" de las pruebas de la Fase 4.
--
-- Ojo: con recetas cargadas, cada plato que cocina marque como entregado
-- descuenta estos insumos del stock (trigger de la migración 0008). Para
-- pruebas está bien: así se ve funcionar la rotación.

do $$
declare
  v_tenant uuid;
  v_sede uuid;
  v_admin uuid;
  v_proveedor uuid;
  v_orden uuid;
  v_faltan text;
begin
  select id into v_tenant from tenants where nombre = 'Restaurante prueba';
  if v_tenant is null then
    raise exception 'No existe el tenant "Restaurante prueba" — este script es solo para la base de pruebas.';
  end if;

  if exists (select 1 from insumos where tenant_id = v_tenant and nombre like 'Demo · %') then
    raise notice 'Los datos demo ya están cargados; no se hace nada. Para recargarlos, corre primero demo_recetas_borrar.sql.';
    return;
  end if;

  select id into v_sede from sedes where tenant_id = v_tenant order by creado_en limit 1;
  select id into v_admin from usuarios
    where tenant_id = v_tenant and rol in ('administracion', 'gerencia') order by rol limit 1;

  -- ------------------------------------------------------------
  -- Insumos: nombre, unidad, tipo, precio de compra por unidad
  -- (precio null = nunca se compró → "Costo incompleto")
  -- ------------------------------------------------------------
  create temp table demo_insumos (nombre text, unidad text, tipo text, costo numeric, compra numeric) on commit drop;
  insert into demo_insumos values
    ('Demo · Carne smash',              'kg',     'exacto',   9.00,  20),
    ('Demo · Carne parrilla',           'kg',     'exacto',  10.00,  10),
    ('Demo · Pollo plancha',            'kg',     'exacto',   6.50,  15),
    ('Demo · Pollo crispy',             'kg',     'exacto',   7.00,  10),
    ('Demo · Chuleta ahumada',          'kg',     'exacto',   8.00,   5),
    ('Demo · Salchicha',                'unidad', 'exacto',   0.40,  60),
    ('Demo · Tocineta',                 'kg',     'exacto',  12.00,   5),
    ('Demo · Jamón',                    'kg',     'exacto',   7.00,   5),
    ('Demo · Queso amarillo',           'kg',     'exacto',   8.00,   8),
    ('Demo · Queso Kraft',              'unidad', 'exacto',   0.25, 200),
    ('Demo · Queso mozzarella',         'kg',     'exacto',   9.00,   6),
    ('Demo · Queso Gouda',              'kg',     'exacto',  11.00,   4),
    ('Demo · Queso cheddar',            'kg',     'exacto',   7.00,   6),
    ('Demo · Parmesano',                'kg',     'exacto',  15.00,   1),
    ('Demo · Huevo',                    'unidad', 'exacto',   0.20, 180),
    ('Demo · Pan de hamburguesa',       'unidad', 'exacto',   0.35, 200),
    ('Demo · Pan árabe',                'unidad', 'exacto',   0.40, 100),
    ('Demo · Pan grande',               'unidad', 'exacto',   0.60,  60),
    ('Demo · Papas',                    'kg',     'exacto',   2.20,  40),
    ('Demo · Papitas de hilo',          'kg',     'exacto',   6.00,   5),
    ('Demo · Lechuga',                  'kg',     'exacto',   2.00,   5),
    ('Demo · Tomate',                   'kg',     'exacto',   1.80,   8),
    ('Demo · Cebolla',                  'kg',     'exacto',   1.50,   8),
    ('Demo · Pepinillos',               'kg',     'exacto',   5.00,   3),
    ('Demo · Maíz',                     'kg',     'exacto',   4.00,   4),
    ('Demo · Jalapeños',                'kg',     'exacto',   6.00,   2),
    ('Demo · Refresco 1 L',             'unidad', 'exacto',   1.00,  24),
    ('Demo · Refresco 1,5 L',           'unidad', 'exacto',   1.40,  24),
    -- 'estimado': no se descuenta del stock por receta, pero sí cuesta
    ('Demo · Salsas y aderezos',        'l',      'estimado', 4.00,  10),
    -- nunca comprados → los platos que los usan salen "Costo incompleto"
    ('Demo · Mermelada de tocino',      'kg',     'exacto',   null, null),
    ('Demo · Fondue de cheddar picante','kg',     'exacto',   null, null),
    ('Demo · Corteza crispy',           'unidad', 'exacto',   null, null);

  insert into insumos (tenant_id, nombre, unidad_de_medida, tipo)
  select v_tenant, nombre, unidad, tipo from demo_insumos;

  -- Igual que crearInsumo (Fase 4): cada insumo nace con su fila de
  -- inventario en la sede, en 0.
  insert into inventario_sede (tenant_id, sede_id, insumo_id, cantidad_actual)
  select v_tenant, v_sede, i.id, 0
  from insumos i join demo_insumos d on d.nombre = i.nombre
  where i.tenant_id = v_tenant;

  -- ------------------------------------------------------------
  -- Una compra recibida, como si se hubiera hecho desde la app
  -- ------------------------------------------------------------
  insert into proveedores (tenant_id, sede_id, nombre, contacto)
  values (v_tenant, v_sede, 'Demo · Distribuidora', 'Datos de demostración')
  returning id into v_proveedor;

  insert into ordenes_compra (tenant_id, sede_id, proveedor_id, estado, creada_por, aprobada_por)
  values (v_tenant, v_sede, v_proveedor, 'recibida', v_admin, v_admin)
  returning id into v_orden;

  insert into ordenes_compra_items (tenant_id, orden_compra_id, insumo_id, cantidad, costo_estimado)
  select v_tenant, v_orden, i.id, d.compra, d.costo
  from insumos i join demo_insumos d on d.nombre = i.nombre
  where i.tenant_id = v_tenant and d.costo is not null;

  -- Recibir la orden suma al stock y deja un movimiento 'entrada'
  -- (mismo efecto que compraService al marcarla recibida).
  update inventario_sede inv
     set cantidad_actual = inv.cantidad_actual + d.compra
    from insumos i join demo_insumos d on d.nombre = i.nombre
   where inv.insumo_id = i.id and inv.sede_id = v_sede
     and i.tenant_id = v_tenant and d.compra is not null;

  insert into movimientos_inventario (tenant_id, sede_id, insumo_id, tipo, cantidad, referencia)
  select v_tenant, v_sede, i.id, 'entrada', d.compra, 'Demo · Orden de compra recibida'
  from insumos i join demo_insumos d on d.nombre = i.nombre
  where i.tenant_id = v_tenant and d.compra is not null;

  -- ------------------------------------------------------------
  -- Recetas: plato, insumo, cantidad (en la unidad del insumo)
  -- ------------------------------------------------------------
  create temp table demo_recetas (plato text, insumo text, cantidad numeric) on commit drop;
  insert into demo_recetas values
    -- American Roof
    ('2/4 de Roof', 'Demo · Pan de hamburguesa', 1), ('2/4 de Roof', 'Demo · Carne smash', 0.18),
    ('2/4 de Roof', 'Demo · Queso Kraft', 2), ('2/4 de Roof', 'Demo · Cebolla', 0.02),
    ('2/4 de Roof', 'Demo · Pepinillos', 0.015), ('2/4 de Roof', 'Demo · Salsas y aderezos', 0.03),
    ('2/4 de Roof', 'Demo · Papas', 0.08),
    ('Cheese burger', 'Demo · Pan de hamburguesa', 1), ('Cheese burger', 'Demo · Carne smash', 0.18),
    ('Cheese burger', 'Demo · Tocineta', 0.06), ('Cheese burger', 'Demo · Queso Kraft', 2),
    ('Cheese burger', 'Demo · Salsas y aderezos', 0.03), ('Cheese burger', 'Demo · Papas', 0.08),
    -- Roof Texas
    ('Carne Texas', 'Demo · Pan de hamburguesa', 1), ('Carne Texas', 'Demo · Carne parrilla', 0.24),
    ('Carne Texas', 'Demo · Tocineta', 0.03), ('Carne Texas', 'Demo · Queso amarillo', 0.03),
    ('Carne Texas', 'Demo · Salsas y aderezos', 0.04),
    ('Pollo Texas', 'Demo · Pan de hamburguesa', 1), ('Pollo Texas', 'Demo · Pollo plancha', 0.24),
    ('Pollo Texas', 'Demo · Tocineta', 0.03), ('Pollo Texas', 'Demo · Queso amarillo', 0.03),
    ('Pollo Texas', 'Demo · Salsas y aderezos', 0.04),
    -- Roof Street
    ('Ahumadita', 'Demo · Pan de hamburguesa', 1), ('Ahumadita', 'Demo · Chuleta ahumada', 0.12),
    ('Ahumadita', 'Demo · Huevo', 1), ('Ahumadita', 'Demo · Tocineta', 0.03), ('Ahumadita', 'Demo · Jamón', 0.03),
    ('Ahumadita', 'Demo · Queso mozzarella', 0.04), ('Ahumadita', 'Demo · Lechuga', 0.02),
    ('Ahumadita', 'Demo · Tomate', 0.03), ('Ahumadita', 'Demo · Cebolla', 0.02), ('Ahumadita', 'Demo · Maíz', 0.02),
    ('Ahumadita', 'Demo · Papitas de hilo', 0.02), ('Ahumadita', 'Demo · Salsas y aderezos', 0.05),
    ('César crispy', 'Demo · Pan de hamburguesa', 1), ('César crispy', 'Demo · Pollo crispy', 0.15),
    ('César crispy', 'Demo · Tocineta', 0.03), ('César crispy', 'Demo · Jamón', 0.03),
    ('César crispy', 'Demo · Queso amarillo', 0.03), ('César crispy', 'Demo · Lechuga', 0.02),
    ('César crispy', 'Demo · Parmesano', 0.01), ('César crispy', 'Demo · Maíz', 0.02),
    ('César crispy', 'Demo · Queso cheddar', 0.04), ('César crispy', 'Demo · Salsas y aderezos', 0.03),
    ('Mixta', 'Demo · Pan de hamburguesa', 1), ('Mixta', 'Demo · Carne smash', 0.09),
    ('Mixta', 'Demo · Pollo plancha', 0.08), ('Mixta', 'Demo · Cebolla', 0.03),
    ('Mixta', 'Demo · Queso amarillo', 0.03), ('Mixta', 'Demo · Queso cheddar', 0.04),
    ('Mixta', 'Demo · Lechuga', 0.02), ('Mixta', 'Demo · Tomate', 0.03),
    ('Mixta', 'Demo · Papitas de hilo', 0.02), ('Mixta', 'Demo · Salsas y aderezos', 0.03),
    ('Triroof', 'Demo · Pan de hamburguesa', 1), ('Triroof', 'Demo · Carne smash', 0.09),
    ('Triroof', 'Demo · Pollo plancha', 0.08), ('Triroof', 'Demo · Chuleta ahumada', 0.08),
    ('Triroof', 'Demo · Huevo', 1), ('Triroof', 'Demo · Tocineta', 0.03), ('Triroof', 'Demo · Jamón', 0.03),
    ('Triroof', 'Demo · Queso amarillo', 0.03), ('Triroof', 'Demo · Queso mozzarella', 0.04),
    ('Triroof', 'Demo · Lechuga', 0.02), ('Triroof', 'Demo · Tomate', 0.03), ('Triroof', 'Demo · Cebolla', 0.02),
    ('Triroof', 'Demo · Maíz', 0.02), ('Triroof', 'Demo · Papitas de hilo', 0.02),
    ('Triroof', 'Demo · Salsas y aderezos', 0.05), ('Triroof', 'Demo · Papas', 0.08),
    -- Roof Island
    ('Cheese miel', 'Demo · Pan de hamburguesa', 1), ('Cheese miel', 'Demo · Carne smash', 0.18),
    ('Cheese miel', 'Demo · Cebolla', 0.03), ('Cheese miel', 'Demo · Queso Kraft', 2),
    ('Cheese miel', 'Demo · Mermelada de tocino', 0.03), ('Cheese miel', 'Demo · Pepinillos', 0.015),
    ('Cheese miel', 'Demo · Salsas y aderezos', 0.04), ('Cheese miel', 'Demo · Papas', 0.08),
    ('Clásica', 'Demo · Pan de hamburguesa', 1), ('Clásica', 'Demo · Carne smash', 0.09),
    ('Clásica', 'Demo · Tocineta', 0.03), ('Clásica', 'Demo · Queso amarillo', 0.03),
    ('Clásica', 'Demo · Lechuga', 0.02), ('Clásica', 'Demo · Tomate', 0.03),
    ('Clásica', 'Demo · Pepinillos', 0.015), ('Clásica', 'Demo · Salsas y aderezos', 0.03),
    ('Clásica doble', 'Demo · Pan de hamburguesa', 1), ('Clásica doble', 'Demo · Carne smash', 0.18),
    ('Clásica doble', 'Demo · Tocineta', 0.03), ('Clásica doble', 'Demo · Queso amarillo', 0.03),
    ('Clásica doble', 'Demo · Lechuga', 0.02), ('Clásica doble', 'Demo · Tomate', 0.03),
    ('Clásica doble', 'Demo · Pepinillos', 0.015), ('Clásica doble', 'Demo · Salsas y aderezos', 0.03),
    ('Clásica doble', 'Demo · Papas', 0.08),
    ('Mayo crispy', 'Demo · Pan de hamburguesa', 1), ('Mayo crispy', 'Demo · Pollo crispy', 0.15),
    ('Mayo crispy', 'Demo · Tocineta', 0.03), ('Mayo crispy', 'Demo · Queso amarillo', 0.03),
    ('Mayo crispy', 'Demo · Queso mozzarella', 0.04), ('Mayo crispy', 'Demo · Lechuga', 0.02),
    ('Mayo crispy', 'Demo · Tomate', 0.03), ('Mayo crispy', 'Demo · Pepinillos', 0.015),
    ('Mayo crispy', 'Demo · Salsas y aderezos', 0.04), ('Mayo crispy', 'Demo · Papas', 0.08),
    ('Smash 286', 'Demo · Pan de hamburguesa', 1), ('Smash 286', 'Demo · Carne smash', 0.18),
    ('Smash 286', 'Demo · Tocineta', 0.03), ('Smash 286', 'Demo · Queso amarillo', 0.03),
    ('Smash 286', 'Demo · Cebolla', 0.03), ('Smash 286', 'Demo · Pepinillos', 0.015),
    ('Smash 286', 'Demo · Queso mozzarella', 0.04), ('Smash 286', 'Demo · Salsas y aderezos', 0.04),
    ('Smash 286', 'Demo · Papas', 0.08),
    -- Roof Spicy
    ('Carne spicy', 'Demo · Pan de hamburguesa', 1), ('Carne spicy', 'Demo · Carne smash', 0.09),
    ('Carne spicy', 'Demo · Tocineta', 0.03), ('Carne spicy', 'Demo · Queso Gouda', 0.03),
    ('Carne spicy', 'Demo · Cebolla', 0.03), ('Carne spicy', 'Demo · Pepinillos', 0.015),
    ('Carne spicy', 'Demo · Salsas y aderezos', 0.04),
    ('Crispy spicy', 'Demo · Pan de hamburguesa', 1), ('Crispy spicy', 'Demo · Pollo crispy', 0.15),
    ('Crispy spicy', 'Demo · Tocineta', 0.03), ('Crispy spicy', 'Demo · Queso Gouda', 0.03),
    ('Crispy spicy', 'Demo · Cebolla', 0.03), ('Crispy spicy', 'Demo · Pepinillos', 0.015),
    ('Crispy spicy', 'Demo · Salsas y aderezos', 0.04), ('Crispy spicy', 'Demo · Papas', 0.08),
    ('Doble spicy', 'Demo · Pan de hamburguesa', 1), ('Doble spicy', 'Demo · Carne smash', 0.18),
    ('Doble spicy', 'Demo · Tocineta', 0.03), ('Doble spicy', 'Demo · Queso Gouda', 0.06),
    ('Doble spicy', 'Demo · Cebolla', 0.03), ('Doble spicy', 'Demo · Pepinillos', 0.015),
    ('Doble spicy', 'Demo · Salsas y aderezos', 0.04), ('Doble spicy', 'Demo · Papas', 0.08),
    ('Queso spicy', 'Demo · Pan de hamburguesa', 1), ('Queso spicy', 'Demo · Carne smash', 0.18),
    ('Queso spicy', 'Demo · Tocineta', 0.03), ('Queso spicy', 'Demo · Queso Gouda', 0.03),
    ('Queso spicy', 'Demo · Pepinillos', 0.015), ('Queso spicy', 'Demo · Fondue de cheddar picante', 0.05),
    ('Queso spicy', 'Demo · Salsas y aderezos', 0.03), ('Queso spicy', 'Demo · Papas', 0.08),
    -- Extreme Roof Bacon
    ('Carne extreme', 'Demo · Pan de hamburguesa', 1), ('Carne extreme', 'Demo · Carne smash', 0.09),
    ('Carne extreme', 'Demo · Tocineta', 0.04), ('Carne extreme', 'Demo · Queso Gouda', 0.03),
    ('Carne extreme', 'Demo · Cebolla', 0.02), ('Carne extreme', 'Demo · Pepinillos', 0.015),
    ('Carne extreme', 'Demo · Salsas y aderezos', 0.04),
    ('Doble extreme', 'Demo · Pan de hamburguesa', 1), ('Doble extreme', 'Demo · Carne smash', 0.18),
    ('Doble extreme', 'Demo · Tocineta', 0.04), ('Doble extreme', 'Demo · Queso Gouda', 0.06),
    ('Doble extreme', 'Demo · Cebolla', 0.02), ('Doble extreme', 'Demo · Pepinillos', 0.015),
    ('Doble extreme', 'Demo · Salsas y aderezos', 0.04), ('Doble extreme', 'Demo · Papas', 0.08),
    -- Enrollados de la Casa
    ('Enrolladito', 'Demo · Pan árabe', 1), ('Enrolladito', 'Demo · Carne parrilla', 0.08),
    ('Enrolladito', 'Demo · Pollo plancha', 0.08), ('Enrolladito', 'Demo · Queso amarillo', 0.03),
    ('Enrolladito', 'Demo · Lechuga', 0.02), ('Enrolladito', 'Demo · Tomate', 0.03),
    ('Enrolladito', 'Demo · Cebolla', 0.02), ('Enrolladito', 'Demo · Salsas y aderezos', 0.04),
    ('Especial', 'Demo · Pan árabe', 1), ('Especial', 'Demo · Carne parrilla', 0.1),
    ('Especial', 'Demo · Pollo plancha', 0.1), ('Especial', 'Demo · Tocineta', 0.03),
    ('Especial', 'Demo · Jamón', 0.03), ('Especial', 'Demo · Queso amarillo', 0.06),
    ('Especial', 'Demo · Salsas y aderezos', 0.05),
    ('Full X2', 'Demo · Pan árabe', 2), ('Full X2', 'Demo · Carne parrilla', 0.2),
    ('Full X2', 'Demo · Pollo plancha', 0.2), ('Full X2', 'Demo · Huevo', 2), ('Full X2', 'Demo · Tocineta', 0.06),
    ('Full X2', 'Demo · Jamón', 0.06), ('Full X2', 'Demo · Queso amarillo', 0.1),
    ('Full X2', 'Demo · Lechuga', 0.04), ('Full X2', 'Demo · Tomate', 0.06), ('Full X2', 'Demo · Cebolla', 0.04),
    ('Full X2', 'Demo · Papitas de hilo', 0.04), ('Full X2', 'Demo · Salsas y aderezos', 0.1),
    ('Full X2', 'Demo · Refresco 1 L', 1),
    ('Mixto premium', 'Demo · Pan árabe', 1), ('Mixto premium', 'Demo · Carne parrilla', 0.12),
    ('Mixto premium', 'Demo · Pollo plancha', 0.12), ('Mixto premium', 'Demo · Tocineta', 0.03),
    ('Mixto premium', 'Demo · Jamón', 0.03), ('Mixto premium', 'Demo · Queso amarillo', 0.04),
    ('Mixto premium', 'Demo · Lechuga', 0.02), ('Mixto premium', 'Demo · Tomate', 0.03),
    ('Mixto premium', 'Demo · Cebolla', 0.02), ('Mixto premium', 'Demo · Papitas de hilo', 0.02),
    ('Mixto premium', 'Demo · Salsas y aderezos', 0.05),
    ('Pollo primavera', 'Demo · Pan árabe', 1), ('Pollo primavera', 'Demo · Pollo plancha', 0.18),
    ('Pollo primavera', 'Demo · Tocineta', 0.03), ('Pollo primavera', 'Demo · Jamón', 0.03),
    ('Pollo primavera', 'Demo · Parmesano', 0.01), ('Pollo primavera', 'Demo · Queso mozzarella', 0.05),
    ('Pollo primavera', 'Demo · Lechuga', 0.02), ('Pollo primavera', 'Demo · Maíz', 0.03),
    ('Pollo primavera', 'Demo · Papitas de hilo', 0.02), ('Pollo primavera', 'Demo · Salsas y aderezos', 0.03),
    ('Súper full X4', 'Demo · Pan árabe', 4), ('Súper full X4', 'Demo · Carne parrilla', 0.4),
    ('Súper full X4', 'Demo · Pollo plancha', 0.4), ('Súper full X4', 'Demo · Chuleta ahumada', 0.2),
    ('Súper full X4', 'Demo · Huevo', 4), ('Súper full X4', 'Demo · Tocineta', 0.12),
    ('Súper full X4', 'Demo · Jamón', 0.12), ('Súper full X4', 'Demo · Queso amarillo', 0.2),
    ('Súper full X4', 'Demo · Lechuga', 0.08), ('Súper full X4', 'Demo · Tomate', 0.12),
    ('Súper full X4', 'Demo · Cebolla', 0.08), ('Súper full X4', 'Demo · Papitas de hilo', 0.08),
    ('Súper full X4', 'Demo · Salsas y aderezos', 0.2), ('Súper full X4', 'Demo · Refresco 1,5 L', 1),
    -- Papas Fritas
    ('Papas cheese', 'Demo · Papas', 0.3), ('Papas cheese', 'Demo · Tocineta', 0.04),
    ('Papas cheese', 'Demo · Queso cheddar', 0.06),
    ('Parripapas', 'Demo · Papas', 0.3), ('Parripapas', 'Demo · Carne parrilla', 0.12),
    ('Parripapas', 'Demo · Pollo plancha', 0.12), ('Parripapas', 'Demo · Queso amarillo', 0.04),
    ('Parripapas', 'Demo · Queso mozzarella', 0.05), ('Parripapas', 'Demo · Maíz', 0.03),
    ('Parripapas', 'Demo · Salsas y aderezos', 0.04),
    ('Ración de papas', 'Demo · Papas', 0.3), ('Ración de papas', 'Demo · Salsas y aderezos', 0.02),
    ('Salchipapas', 'Demo · Papas', 0.3), ('Salchipapas', 'Demo · Salchicha', 2),
    ('Salchipapas', 'Demo · Queso amarillo', 0.03), ('Salchipapas', 'Demo · Salsas y aderezos', 0.04),
    -- Pepitos
    ('Pepiroof', 'Demo · Pan grande', 1), ('Pepiroof', 'Demo · Carne parrilla', 0.1),
    ('Pepiroof', 'Demo · Pollo plancha', 0.1), ('Pepiroof', 'Demo · Tocineta', 0.03), ('Pepiroof', 'Demo · Huevo', 1),
    ('Pepiroof', 'Demo · Jamón', 0.03), ('Pepiroof', 'Demo · Queso amarillo', 0.04),
    ('Pepiroof', 'Demo · Lechuga', 0.02), ('Pepiroof', 'Demo · Tomate', 0.03), ('Pepiroof', 'Demo · Cebolla', 0.02),
    ('Pepiroof', 'Demo · Papitas de hilo', 0.02), ('Pepiroof', 'Demo · Salsas y aderezos', 0.05),
    ('Super pepiroof', 'Demo · Pan grande', 2), ('Super pepiroof', 'Demo · Carne parrilla', 0.2),
    ('Super pepiroof', 'Demo · Pollo plancha', 0.2), ('Super pepiroof', 'Demo · Tocineta', 0.06),
    ('Super pepiroof', 'Demo · Huevo', 2), ('Super pepiroof', 'Demo · Jamón', 0.06),
    ('Super pepiroof', 'Demo · Queso amarillo', 0.06), ('Super pepiroof', 'Demo · Queso mozzarella', 0.08),
    ('Super pepiroof', 'Demo · Maíz', 0.04), ('Super pepiroof', 'Demo · Papitas de hilo', 0.04),
    ('Super pepiroof', 'Demo · Queso cheddar', 0.06), ('Super pepiroof', 'Demo · Salsas y aderezos', 0.08),
    ('Super pepiroof', 'Demo · Refresco 1 L', 1),
    -- Platos Fit (Plato fit de pollo queda sin receta a propósito)
    ('Enrollado fit', 'Demo · Lechuga', 0.08), ('Enrollado fit', 'Demo · Carne parrilla', 0.1),
    ('Enrollado fit', 'Demo · Pollo plancha', 0.1), ('Enrollado fit', 'Demo · Huevo', 1),
    ('Enrollado fit', 'Demo · Tocineta', 0.03), ('Enrollado fit', 'Demo · Queso amarillo', 0.03),
    ('Enrollado fit', 'Demo · Queso mozzarella', 0.04),
    -- Extras
    ('Huevo', 'Demo · Huevo', 1),
    ('Jalapeños', 'Demo · Jalapeños', 0.04),
    ('Maíz', 'Demo · Maíz', 0.04),
    ('Monster crispy', 'Demo · Corteza crispy', 1), ('Monster crispy', 'Demo · Queso mozzarella', 0.05),
    ('Pepinillos', 'Demo · Pepinillos', 0.04),
    ('Queso amarillo', 'Demo · Queso amarillo', 0.04),
    ('Queso mozzarella gratinado', 'Demo · Queso mozzarella', 0.05),
    ('Topping de queso cheddar', 'Demo · Queso cheddar', 0.05),
    ('Trozos de tocineta', 'Demo · Tocineta', 0.04);

  -- Avisar si algún plato o insumo de la lista no existe (por ejemplo, si
  -- se renombró un plato en el menú): esas líneas no se cargan.
  select string_agg(distinct dr.plato || ' / ' || dr.insumo, ', ') into v_faltan
  from demo_recetas dr
  left join menu_items mi on mi.tenant_id = v_tenant and mi.nombre = dr.plato
  left join insumos i on i.tenant_id = v_tenant and i.nombre = dr.insumo
  where mi.id is null or i.id is null;
  if v_faltan is not null then
    raise notice 'No se cargaron estas líneas (plato o insumo no encontrado): %', v_faltan;
  end if;

  -- Solo platos que todavía no tienen receta: no pisa ninguna receta real.
  insert into recetas (tenant_id, menu_item_id, insumo_id, cantidad_requerida, unidad)
  select v_tenant, mi.id, i.id, dr.cantidad, i.unidad_de_medida
  from demo_recetas dr
  join menu_items mi on mi.tenant_id = v_tenant and mi.nombre = dr.plato
  join insumos i on i.tenant_id = v_tenant and i.nombre = dr.insumo
  where not exists (
    select 1 from recetas r
    join insumos ri on ri.id = r.insumo_id
    where r.menu_item_id = mi.id and ri.nombre not like 'Demo · %'
  );

  raise notice 'Datos demo cargados: % insumos, % líneas de receta.',
    (select count(*) from insumos where tenant_id = v_tenant and nombre like 'Demo · %'),
    (select count(*) from recetas r join insumos i on i.id = r.insumo_id
      where r.tenant_id = v_tenant and i.nombre like 'Demo · %');
end;
$$;
