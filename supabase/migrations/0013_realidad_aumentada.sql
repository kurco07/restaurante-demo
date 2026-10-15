-- ============================================================
-- Realidad aumentada — adelantada por necesidad de marketing (2026-10-15)
-- ============================================================
-- Ver arquitectura.md §4.6 y modelo-de-datos.md "Extensiones futuras":
-- ya estaba decidido que cuando se active, menu_items gana estas dos
-- columnas nulas. Se adelanta solo esto (no el panel de carga por
-- restaurante, no la conversión automática .glb→.usdz) para tener 1-2
-- platos reales en RA y grabar un video — el resto de la Fase 3 de RA
-- (negocio) sigue sin construirse.
--
-- glb para Android (WebXR/Scene Viewer) y navegador; usdz para iPhone
-- (Quick Look) — <model-viewer> necesita los dos para cubrir ambos.
-- Nulas por defecto: un plato sin modelo simplemente no muestra "Ver en RA".

alter table public.menu_items add column modelo_ar_glb_url text;
alter table public.menu_items add column modelo_ar_usdz_url text;

-- Bucket público de Storage para los archivos .glb/.usdz. Público porque
-- Quick Look/Scene Viewer son visores nativos del sistema operativo que
-- abren la URL directo — no pueden mandar el token de auth de Supabase.
insert into storage.buckets (id, name, public)
values ('modelos-3d', 'modelos-3d', true)
on conflict (id) do nothing;

create policy "modelos_3d_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'modelos-3d');

create policy "modelos_3d_escritura_autenticados"
  on storage.objects for insert
  with check (bucket_id = 'modelos-3d' and auth.role() = 'authenticated');

-- menu_publico_mesa (0003) se redefine para incluir los dos campos nuevos
-- — el cliente de autopedido también necesita ver el botón de RA.
create or replace function public.menu_publico_mesa(p_mesa_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'restaurante', t.nombre,
    'mesa', jsonb_build_object('id', m.id, 'nombre_numero', m.nombre_numero),
    'categorias', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'nombre', c.nombre) order by c.orden, c.nombre)
      from categorias_menu c
      where c.tenant_id = m.tenant_id
    ), '[]'::jsonb),
    'platos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', mi.id,
        'categoria_id', mi.categoria_id,
        'nombre', mi.nombre,
        'descripcion', mi.descripcion,
        'precio', coalesce(mis.precio_override, mi.precio_base),
        'imagen_url', mi.imagen_url,
        'modelo_ar_glb_url', mi.modelo_ar_glb_url,
        'modelo_ar_usdz_url', mi.modelo_ar_usdz_url
      ) order by mi.nombre)
      from menu_items mi
      left join menu_item_sede mis on mis.menu_item_id = mi.id and mis.sede_id = m.sede_id
      where mi.tenant_id = m.tenant_id
        and coalesce(mis.disponible, true)
    ), '[]'::jsonb)
  )
  from mesas m
  join tenants t on t.id = m.tenant_id
  where m.id = p_mesa_id
    and t.estado = 'activo'
$$;
