-- Panel: datos del gimnasio, perfil editable, equipos y soporte. Planes y clases ya tienen escritura para el dueño.
alter table gyms
  add column legal_name text, add column fiscal_address text, add column address text, add column phone text,
  add column ruc text check (ruc is null or ruc ~ '^[0-9]{11}$'),
  add column warn_days int not null default 7 check (warn_days between 1 and 30);
alter table profiles add column phone text;

create policy gyms_u on gyms for update using (id=my_gym() and my_role()='owner');
revoke update on gyms from authenticated;
grant update(name,legal_name,ruc,fiscal_address,address,phone,warn_days) on gyms to authenticated;
create policy prof_u on profiles for update using (user_id=auth.uid());
revoke update on profiles from authenticated;
grant update(full_name,phone) on profiles to authenticated;

-- Los planes se archivan (active=false); el nombre solo debe ser único entre los activos
alter table plans drop constraint plans_gym_id_name_key;
create unique index plans_active_name on plans(gym_id, lower(name)) where active;

create table equipment(id bigint generated always as identity primary key, gym_id bigint not null references gyms on delete cascade,
  name text not null, category text not null default 'Otros', quantity int not null default 1 check (quantity>=0),
  status text not null default 'operativo' check (status in ('operativo','mantenimiento','fuera_servicio')), notes text, created_at timestamptz default now());
create table support_tickets(id bigint generated always as identity primary key, gym_id bigint not null references gyms on delete cascade,
  user_id uuid not null default auth.uid() references auth.users, subject text not null, message text not null,
  status text not null default 'abierto' check (status in ('abierto','en_proceso','resuelto')), created_at timestamptz default now());
alter table equipment enable row level security; alter table support_tickets enable row level security;
create policy eq_r on equipment for select using (gym_id=my_gym());
create policy eq_w on equipment for all using (gym_id=my_gym() and my_role() in ('owner','reception')) with check (gym_id=my_gym() and my_role() in ('owner','reception'));
create policy tk_r on support_tickets for select using (gym_id=my_gym() and (user_id=auth.uid() or my_role()='owner'));
create policy tk_i on support_tickets for insert with check (gym_id=my_gym() and user_id=auth.uid());
revoke all on equipment, support_tickets from anon;
