-- Gymxio · esquema completo (Supabase / Postgres). Ejecutar en SQL Editor.
create extension if not exists pgcrypto;
create function gym_today() returns date language sql stable as $$ select (now() at time zone 'America/Lima')::date $$;

create table gyms(id bigint generated always as identity primary key, name text not null, created_at timestamptz default now());
create table profiles(user_id uuid primary key references auth.users on delete cascade, gym_id bigint not null references gyms on delete cascade,
  role text not null check (role in ('owner','reception','trainer')), full_name text);
create table plans(id bigint generated always as identity primary key, gym_id bigint not null references gyms on delete cascade,
  name text not null, days int not null check (days>0), price numeric(10,2) not null check (price>=0), active boolean default true, unique(gym_id,name));
create table members(id bigint generated always as identity primary key, gym_id bigint not null references gyms on delete cascade,
  name text not null, dni text not null, phone text, plan_id bigint references plans, plan_name text, start_date date, end_date date,
  qr_token text not null default encode(gen_random_bytes(6),'hex'), has_bio boolean not null default false, created_at timestamptz default now(), unique(gym_id,dni));
create table member_credentials(id bigint generated always as identity primary key, gym_id bigint not null references gyms on delete cascade,
  member_id bigint not null references members on delete cascade, credential_id text not null unique, created_at timestamptz default now());
create table payments(id bigint generated always as identity primary key, gym_id bigint not null references gyms on delete cascade,
  member_id bigint not null references members on delete cascade, plan_name text, amount numeric(10,2) not null,
  method text not null check (method in ('Efectivo','Yape','Tarjeta')), paid_on date not null default gym_today(), created_by uuid default auth.uid());
create table attendance(id bigint generated always as identity primary key, gym_id bigint not null references gyms on delete cascade,
  member_id bigint not null references members on delete cascade, day date not null default gym_today(), at timestamptz not null default now(),
  via text not null check (via in ('manual','qr','bio')), unique(member_id,day));
create table classes(id bigint generated always as identity primary key, gym_id bigint not null references gyms on delete cascade,
  name text not null, days text not null, at_time time not null, coach text, capacity int not null default 20, sort int default 0);

create function my_gym() returns bigint language sql stable security definer set search_path=public as $$ select gym_id from profiles where user_id=auth.uid() $$;
create function my_role() returns text language sql stable security definer set search_path=public as $$ select role from profiles where user_id=auth.uid() $$;
create function need_role(r text[]) returns bigint language plpgsql stable security definer set search_path=public as $$
declare g bigint; ro text;
begin select gym_id, role into g, ro from profiles where user_id=auth.uid();
  if g is null or not ro = any(r) then raise exception 'No tienes permiso para esta acción.'; end if; return g; end $$;
