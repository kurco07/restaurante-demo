-- ============================================================
-- Fase 4 — Inventario real: insumos, lotes, movimientos, compras
-- ============================================================
-- Columnas nuevas, cada una respaldada por una necesidad real de la UI o
-- de arquitectura.md — no se inventan "por si acaso" (ver el plan de
-- esta fase para la justificación completa de qué se agrega y qué se
-- corta del mockup original).

-- "Alertas de stock bajo" ya está decidido en arquitectura.md §4.3.
-- Nulo = sin alerta configurada para ese insumo en esa sede.
alter table public.inventario_sede add column stock_minimo numeric(12,3);

-- FEFO real (decisión confirmada con el usuario, 2026-10-11): un lote
-- puede vencer antes que otro más viejo. Nulo = sin fecha conocida, se
-- ordena por fecha de apertura como antes.
alter table public.lotes_insumo add column fecha_vencimiento date;

-- Trazabilidad de ajustes manuales. Nulo = movimiento automático (el
-- trigger de descuento de abajo, o una orden de compra recibida).
alter table public.movimientos_inventario add column creado_por uuid references public.usuarios(id);

-- ordenes_compra no tenía ninguna columna de fecha — la necesita el
-- stat "Órdenes del mes" que ya está en el mockup de compras.
alter table public.ordenes_compra add column creado_en timestamptz not null default now();

-- ------------------------------------------------------------
-- Descuento automático de inventario al entregar un pedido
-- ------------------------------------------------------------
-- pedidos_items.estado pasa a 'entregado' mediante una escritura LOCAL
-- de PowerSync (offline-capaz, ver pedidoService.ts/useCocina.ts) —
-- inventario_sede/lotes_insumo/movimientos_inventario son online-only
-- (no están en powerSyncClient.ts). Por eso el descuento no puede ser
-- una llamada síncrona desde la pantalla de cocina: este trigger
-- reacciona cuando la fila llega al servidor, sea por escritura directa
-- o porque PowerSync la subió tarde desde la cola offline.
--
-- Insumos 'estimado' no se descuentan (arquitectura.md §5, ya decidido:
-- "no se intenta rastrear con precisión unidad por unidad").
-- Insumos 'por_lote' descuentan del lote FEFO (vencimiento más próximo;
-- sin vencimiento, el más viejo) — v1 simple: de un solo lote, sin
-- dividir entre varios si ese no alcanza (limitación conocida).
-- Si inventario_sede no tiene fila para ese insumo/sede, el update no
-- afecta nada — por eso crearInsumo (Módulo 1) siempre crea esa fila.

create or replace function public.descontar_inventario_por_entrega()
returns trigger
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
  if new.estado = 'entregado' and old.estado is distinct from 'entregado' then
    for r in
      select rec.insumo_id, rec.cantidad_requerida * new.cantidad as cantidad_requerida, i.tipo
      from recetas rec
      join insumos i on i.id = rec.insumo_id
      where rec.menu_item_id = new.menu_item_id
    loop
      if r.tipo = 'estimado' then
        continue;
      end if;

      v_a_descontar := r.cantidad_requerida;

      update inventario_sede
         set cantidad_actual = cantidad_actual - v_a_descontar
       where sede_id = new.sede_id and insumo_id = r.insumo_id;

      if r.tipo = 'por_lote' then
        select id, cantidad_restante into v_lote
        from lotes_insumo
        where sede_id = new.sede_id and insumo_id = r.insumo_id
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
      values (new.tenant_id, new.sede_id, r.insumo_id, 'salida', v_a_descontar, 'Pedido ' || new.id, now());
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_items_descontar_inventario on public.pedidos_items;
create trigger pedidos_items_descontar_inventario
  after update on public.pedidos_items
  for each row execute function public.descontar_inventario_por_entrega();
