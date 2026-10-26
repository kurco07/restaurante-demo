-- ============================================================
-- DATOS DE DEMOSTRACIÓN — necesidades de compra en la Sede Norte
-- ============================================================
-- NO es una migración y NO debe correrse en la base de un restaurante
-- real. Sirve para probar las sugerencias de compra de la IA (Fase 6,
-- Módulo 2) con datos que tengan sentido.
--
-- Requiere demo_segunda_sede.sql. Solo toca la sede "Demo · Sede Norte",
-- que es toda inventada: demo_segunda_sede_borrar.sql la borra entera,
-- con esto incluido.
--
-- Qué hace: con el stock que deja demo_segunda_sede.sql, la Sede Norte
-- tiene para más de una semana y no habría nada que sugerir. Esto baja el
-- stock de los 8 insumos que más se consumen a entre 1 y 4 días de
-- consumo, y les pone un stock mínimo de 2 días a 4 de ellos.
--
-- Cómo probar con el usuario de administración de prueba, que es de la
-- sede original (cuyas ventas demo no tocan el inventario):
--   1. Pasarlo a la Sede Norte (en el SQL Editor):
--        update usuarios set sede_id = (select id from sedes where nombre = 'Demo · Sede Norte')
--        where rol = 'administracion' and tenant_id = (select id from tenants where nombre = 'Restaurante prueba');
--   2. Cerrar sesión y volver a entrar como administración.
--   3. Al terminar, devolverlo a su sede:
--        update usuarios set sede_id = (select id from sedes where tenant_id = usuarios.tenant_id order by creado_en limit 1)
--        where rol = 'administracion' and tenant_id = (select id from tenants where nombre = 'Restaurante prueba');

do $$
declare
  v_sede uuid;
begin
  select s.id into v_sede
  from sedes s join tenants t on t.id = s.tenant_id
  where t.nombre = 'Restaurante prueba' and s.nombre = 'Demo · Sede Norte';
  if v_sede is null then
    raise exception 'No existe la sede "Demo · Sede Norte": corre primero demo_segunda_sede.sql.';
  end if;

  with consumo as (
    select insumo_id, sum(cantidad) / 28.0 as diario
    from movimientos_inventario
    where sede_id = v_sede and tipo in ('salida', 'merma') and fecha >= now() - interval '28 days'
    group by insumo_id
    order by 2 desc
    limit 8
  ),
  numerados as (
    select insumo_id, diario, row_number() over (order by diario desc) as n from consumo
  )
  update inventario_sede inv
     set cantidad_actual = round(n.diario * (1 + (n.n % 4)), 2),
         stock_minimo = case when n.n <= 4 then round(n.diario * 2, 2) else inv.stock_minimo end
    from numerados n
   where inv.sede_id = v_sede and inv.insumo_id = n.insumo_id;

  raise notice 'Listo: 8 insumos de la Sede Norte quedaron con stock para 1 a 4 días.';
end;
$$;
