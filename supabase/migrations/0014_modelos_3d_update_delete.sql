-- ============================================================
-- Realidad aumentada — permitir reemplazar/borrar modelos 3D
-- ============================================================
-- La migración 0013 solo dejó policy de insert para el bucket
-- modelos-3d — al intentar reemplazar un archivo (actualizar/borrar
-- el existente) Postgres bloqueaba con "row violates row-level
-- security policy". Esto completa el CRUD para usuarios autenticados;
-- la lectura pública (0013) no cambia.

create policy "modelos_3d_actualizacion_autenticados"
  on storage.objects for update
  using (bucket_id = 'modelos-3d' and auth.role() = 'authenticated')
  with check (bucket_id = 'modelos-3d' and auth.role() = 'authenticated');

create policy "modelos_3d_borrado_autenticados"
  on storage.objects for delete
  using (bucket_id = 'modelos-3d' and auth.role() = 'authenticated');
