-- ============================================================
-- Fase 4 — Incremento atómico de inventario_sede
-- ============================================================
-- Registrar un lote (Módulo 3) o recibir una orden de compra (Módulo 5)
-- suma cantidad al stock de la sede. Un update `cantidad_actual =
-- cantidad_actual + X` directo desde el cliente sería una condición de
-- carrera si dos personas registran una entrada del mismo insumo casi
-- al mismo tiempo; esta función lo hace en una sola operación atómica
-- del lado del servidor. Sin security definer: corre con los permisos
-- de quien la llama, las políticas de RLS de inventario_sede ya
-- existentes siguen aplicando igual que si fuera un update directo.

create or replace function public.incrementar_inventario_sede(p_sede_id uuid, p_insumo_id uuid, p_cantidad numeric)
returns void
language sql
as $$
  update inventario_sede
  set cantidad_actual = cantidad_actual + p_cantidad
  where sede_id = p_sede_id and insumo_id = p_insumo_id
$$;
