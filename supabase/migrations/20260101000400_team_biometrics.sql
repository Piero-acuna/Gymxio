-- "Equipos" pasa a ser el equipo de trabajo (cuentas de empleados): se elimina el inventario de máquinas
drop table if exists equipment;

-- Correo visible en el equipo de trabajo (se completa solo desde auth.users)
alter table profiles add column email text;
create function set_profile_email() returns trigger language plpgsql security definer set search_path=public as $$
begin new.email := (select email from auth.users where id=new.user_id); return new; end $$;
create trigger profiles_email before insert on profiles for each row execute function set_profile_email();
update profiles p set email=u.email from auth.users u where u.id=p.user_id and p.email is null;

-- Configuración de acceso biométrico: none (solo QR) | phone (celular del miembro) | device (equipos del gimnasio)
alter table gyms add column biometric_mode text not null default 'phone' check (biometric_mode in ('none','phone','device')), add column device_key_hash text;
grant update(biometric_mode) on gyms to authenticated;

alter table members add column device_user_id int, add column enroll_token text not null default encode(gen_random_bytes(16),'hex');
create function set_device_uid() returns trigger language plpgsql set search_path=public as $$
begin
  if new.device_user_id is null then select coalesce(max(device_user_id),0)+1 into new.device_user_id from members where gym_id=new.gym_id; end if;
  return new;
end $$;
create trigger members_device_uid before insert on members for each row execute function set_device_uid();
update members m set device_user_id=r.n from (select id, row_number() over (partition by gym_id order by id) n from members) r where m.id=r.id and m.device_user_id is null;
create unique index members_device_uid_idx on members(gym_id, device_user_id);

-- Credenciales WebAuthn verificadas en el servidor (api/bio.js)
alter table member_credentials add column public_key text, add column counter bigint not null default 0, add column transports text[];
create table webauthn_challenges(id uuid primary key default gen_random_uuid(), challenge text not null, purpose text not null, member_id bigint, created_at timestamptz not null default now());
alter table webauthn_challenges enable row level security;  -- sin políticas: solo el servidor (service_role) accede

-- Ingreso desde el servidor (lectores y celulares). Solo service_role puede ejecutarla.
create function check_in_server(p_gym bigint, p_member bigint default null, p_device_uid int default null, p_via text default 'bio') returns text
language plpgsql security definer set search_path=public as $$
declare m members;
begin
  select * into m from members where gym_id=p_gym and ((p_member is not null and members.id=p_member) or (p_member is null and p_device_uid is not null and device_user_id=p_device_uid));
  if not found then raise exception 'Miembro no encontrado.'; end if;
  if m.end_date is null or m.end_date < gym_today() then raise exception 'Membresía vencida. Renueva para registrar el ingreso.'; end if;
  insert into attendance(gym_id,member_id,via) values (p_gym,m.id,p_via) on conflict (member_id,day) do nothing;
  if not found then raise exception '% ya ingresó hoy.', m.name; end if;
  return m.name;
end $$;
revoke execute on function check_in_server(bigint,bigint,int,text) from public, anon, authenticated;
grant execute on function check_in_server(bigint,bigint,int,text) to service_role;

-- Clave de integración para lectores: se muestra una sola vez; se guarda solo su hash
create function rotate_device_key() returns text language plpgsql security definer set search_path=public, extensions as $$
declare g bigint := need_role(array['owner']); k text := encode(gen_random_bytes(24),'hex');
begin update gyms set device_key_hash=encode(digest(k,'sha256'),'hex') where id=g; return k; end $$;
revoke execute on function rotate_device_key() from public, anon;
grant execute on function rotate_device_key() to authenticated;
