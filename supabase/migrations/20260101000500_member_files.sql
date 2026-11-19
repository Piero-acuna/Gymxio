-- Foto del rostro y DNI de los miembros (Storage privado, acceso por gimnasio y rol)
alter table members add column photo_path text, add column dni_front_path text, add column dni_back_path text, add column consent_at timestamptz;
grant update(photo_path, dni_front_path, dni_back_path, consent_at) on members to authenticated;

-- Bucket privado: solo JPEG de hasta 2 MB. La app convierte y reduce cada imagen antes de subirla.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-files', 'member-files', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

-- Ruta: <gym_id>/<member_id>/<photo|dni_front|dni_back>.jpg
-- Ver: dueño y recepción ven todo; el entrenador solo ve la foto del rostro. Escribir: dueño y recepción.
create policy mf_read on storage.objects for select using (
  bucket_id = 'member-files' and (storage.foldername(name))[1] = my_gym()::text
  and (my_role() in ('owner','reception') or storage.filename(name) like 'photo.%'));
create policy mf_ins on storage.objects for insert with check (
  bucket_id = 'member-files' and (storage.foldername(name))[1] = my_gym()::text and my_role() in ('owner','reception'));
create policy mf_upd on storage.objects for update using (
  bucket_id = 'member-files' and (storage.foldername(name))[1] = my_gym()::text and my_role() in ('owner','reception'));
create policy mf_del on storage.objects for delete using (
  bucket_id = 'member-files' and (storage.foldername(name))[1] = my_gym()::text and my_role() in ('owner','reception'));
