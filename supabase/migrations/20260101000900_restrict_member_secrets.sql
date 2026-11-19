-- Aplicada en el proyecto de Supabase tras desplegar la app actualizada.
-- Impide que el entrenador (o cualquier sesión) lea qr_token y enroll_token con select directo: con ellos podría falsificar un QR o vincular su celular como otro miembro.
-- Con este cambio, "select *" sobre members deja de funcionar; la app ya pide columnas explícitas y usa member_secrets() para el carnet.
-- Al agregar columnas nuevas a members, hay que concederles select explícitamente.
revoke select on members from authenticated;
grant select (id, gym_id, name, dni, phone, plan_id, plan_name, start_date, end_date, has_bio, created_at, device_user_id, photo_path, dni_front_path, dni_back_path, consent_at) on members to authenticated;
