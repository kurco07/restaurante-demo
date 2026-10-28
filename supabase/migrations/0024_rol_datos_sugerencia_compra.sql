-- ============================================================
-- datos_sugerencia_compra() no tenía el mismo filtro de rol que su
-- función hermana datos_platos_preparar() (migración 0022) — cualquier
-- usuario autenticado de la sede (mesonero, cocina) podía llamarla
-- directo por API y ver costos/proveedores de insumos de su sede, aunque
-- la pantalla real (solo administración/gerencia) sí estaba protegida.
-- Acotado a la sede propia, sin fuga entre restaurantes — pero mismo
-- patrón de "la pantalla protege, la función no" que ya se cerró para
-- platos_a_preparar. Se agrega el mismo guard acá: una fila 'sede' que
-- solo existe si quien llama tiene el rol correcto, y la consulta final
-- no devuelve nada si esa fila no existe.
-- ============================================================

create or replace function public.datos_sugerencia_compra(p_sede_id uuid, p_dias integer default 7)
returns jsonb
language sql
stable
set search_path = public
as $$
  with sede as (
    select id from sedes
    where id = p_sede_id
      and coalesce(public.current_rol(), '') in ('gerencia', 'administracion', 'super_admin')
  ),
  consumo as (
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
  where exists (select 1 from sede)
$$;

revoke all on function public.datos_sugerencia_compra(uuid, integer) from public, anon;
grant execute on function public.datos_sugerencia_compra(uuid, integer) to authenticated;
