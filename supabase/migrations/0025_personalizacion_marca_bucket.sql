-- ============================================================
-- Fase 7, Módulo 4 — Personalización de marca
-- ============================================================
-- `personalizacion_marca` ya existía en el esquema (migración 0002:
-- tenant_id, logo_url, color_primario, color_secundario, nombre_mostrado)
-- pero nunca se usó desde ningún código — y su política de RLS
-- ("personalizacion_marca_tenant", for all) dejaba escribir a CUALQUIER
-- usuario del tenant, incluyendo mesonero/cocina, el mismo patrón de
-- "la pantalla protege pero la función no" que ya se cerró antes para
-- datos_platos_preparar (0022) y datos_sugerencia_compra (0024). Se
-- separa en dos políticas: lectura abierta a todo el tenant (todas las
-- pantallas necesitan poder pintar el color/logo), escritura solo para
-- administracion/gerencia.
--
-- Se agrega también el bucket de Storage para los logos, con el mismo
-- patrón de `modelos-3d` (migración 0013) pero con escritura acotada por
-- tenant+rol en vez de "cualquier autenticado" — un logo es dato propio
-- del restaurante, no un activo de marketing compartido.
-- ============================================================

drop policy if exists "personalizacion_marca_tenant" on public.personalizacion_marca;

create policy "personalizacion_marca_lectura" on public.personalizacion_marca
  for select using (tenant_id = public.current_tenant_id());

create policy "personalizacion_marca_escritura" on public.personalizacion_marca
  for all using (
    tenant_id = public.current_tenant_id()
    and public.current_rol() in ('administracion', 'gerencia')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_rol() in ('administracion', 'gerencia')
  );

insert into storage.buckets (id, name, public)
values ('marca', 'marca', true)
on conflict (id) do nothing;

create policy "marca_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'marca');

-- Los objetos se guardan como marca/<tenant_id>/logo.<ext> — el primer
-- segmento de la ruta tiene que ser el tenant de quien escribe, y solo
-- administracion/gerencia (no cualquier autenticado, a diferencia de
-- modelos-3d).
create policy "marca_escritura_tenant_propio"
  on storage.objects for insert
  with check (
    bucket_id = 'marca'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_rol() in ('administracion', 'gerencia')
  );

create policy "marca_actualizacion_tenant_propio"
  on storage.objects for update
  using (
    bucket_id = 'marca'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_rol() in ('administracion', 'gerencia')
  );

create policy "marca_borrado_tenant_propio"
  on storage.objects for delete
  using (
    bucket_id = 'marca'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
    and public.current_rol() in ('administracion', 'gerencia')
  );
