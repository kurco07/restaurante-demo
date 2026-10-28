-- ============================================================
-- Fase 7, Módulo 5 — Interruptores de módulos por restaurante
-- ============================================================
-- Pedido del dueño (referencia de su jefa: un panel tipo "Configuración
-- del Portal" con un interruptor por función). Acá el equivalente es que
-- super-admin prenda/apague, por restaurante, las funciones que no son
-- el núcleo operativo (mesoneros/cocina/autopedido/inventario siguen
-- siempre encendidas — eso nunca se apaga): las de IA, alertas de
-- gerencia, vista multi-sede y realidad aumentada. Encaja con lo que ya
-- decía la tabla de precios (Estrategia_Comercial_Ejecutiva.md: Starter
-- trae lo básico, Pro trae IA/reportes avanzados) pero que hasta ahora
-- nunca se aplicaba de verdad en el código.
--
-- Siempre hay una fila por cada módulo de la lista para cada tenant
-- configurado — nunca "ausencia = apagado" ni "ausencia = prendido"
-- calculado en dos lugares distintos; se decide una sola vez acá.
-- ============================================================

create table public.tenant_modulos (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  modulo text not null check (modulo in (
    'ia_sugerencias_compra',
    'ia_sugerencias_platos',
    'ia_recomendados',
    'alertas_gerencia',
    'multi_sede',
    'realidad_aumentada'
  )),
  activo boolean not null default true,
  primary key (tenant_id, modulo)
);

alter table public.tenant_modulos enable row level security;

-- Cualquiera del tenant necesita poder leerlo (para saber qué mostrar);
-- solo super-admin decide qué está prendido o apagado — es el equipo del
-- SaaS quien vende/activa funciones, no el restaurante mismo.
create policy "tenant_modulos_lectura" on public.tenant_modulos
  for select using (tenant_id = public.current_tenant_id() or public.current_rol() = 'super_admin');

create policy "tenant_modulos_escritura_super_admin" on public.tenant_modulos
  for all using (public.current_rol() = 'super_admin')
  with check (public.current_rol() = 'super_admin');

-- Aplica el paquete por defecto de un plan de una sola vez (botón
-- "Aplicar preset" en el panel de super-admin) — Starter arranca con todo
-- apagado, Pro con todo prendido. Después de aplicarlo, super-admin puede
-- seguir ajustando módulo por módulo encima (un update normal sobre la
-- tabla, ya cubierto por la política de arriba).
create or replace function public.aplicar_preset_modulos(p_tenant_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_modulo text;
  v_activo boolean := (p_plan = 'pro');
begin
  if coalesce(public.current_rol(), '') <> 'super_admin' then
    raise exception 'Solo super-admin puede aplicar un preset de módulos.';
  end if;

  foreach v_modulo in array array[
    'ia_sugerencias_compra', 'ia_sugerencias_platos', 'ia_recomendados',
    'alertas_gerencia', 'multi_sede', 'realidad_aumentada'
  ]
  loop
    insert into public.tenant_modulos (tenant_id, modulo, activo)
    values (p_tenant_id, v_modulo, v_activo)
    on conflict (tenant_id, modulo) do update set activo = excluded.activo;
  end loop;
end;
$$;

revoke all on function public.aplicar_preset_modulos(uuid, text) from public, anon;
grant execute on function public.aplicar_preset_modulos(uuid, text) to authenticated;

-- Los tenants que ya existían antes de este módulo (el piloto incluido)
-- siguen exactamente igual que hoy: todo prendido. El preset por plan
-- recién aplica de acá en adelante — para un tenant nuevo (provisionar_
-- tenant, migración 0027) o cuando super-admin lo aplique a mano.
insert into public.tenant_modulos (tenant_id, modulo, activo)
select t.id, m.modulo, true
from public.tenants t
cross join (
  select unnest(array[
    'ia_sugerencias_compra', 'ia_sugerencias_platos', 'ia_recomendados',
    'alertas_gerencia', 'multi_sede', 'realidad_aumentada'
  ]) as modulo
) m
on conflict (tenant_id, modulo) do nothing;
