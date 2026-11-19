-- Libro de Reclamaciones virtual (DS 011-2011-PCM, Anexo I). gym_id nulo = libro de la plataforma Gymxio.
alter table gyms add column slug text;
update gyms set slug = substr(md5(random()::text || id::text), 1, 8) where slug is null;
alter table gyms alter column slug set default substr(md5(random()::text || clock_timestamp()::text), 1, 8), alter column slug set not null;
create unique index gyms_slug_idx on gyms(slug);

-- Suma días hábiles (sábado y domingo no cuentan). No descuenta feriados: el plazo calculado es el más corto y por tanto el más seguro.
create function add_business_days(d date, n int) returns date language plpgsql immutable set search_path=public as $$
declare r date := d; k int := 0;
begin
  while k < n loop r := r + 1; if extract(isodow from r) < 6 then k := k + 1; end if; end loop;
  return r;
end $$;

create table complaints(
  id bigint generated always as identity primary key,
  gym_id bigint references gyms on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  due_date date not null,
  kind text not null check (kind in ('reclamo','queja')),
  consumer_name text not null,
  doc_type text not null check (doc_type in ('DNI','CE','PAS','RUC')),
  doc_number text not null,
  address text not null, phone text not null, email text not null,
  guardian_name text, guardian_doc text,
  service_desc text not null,
  amount numeric(10,2) check (amount is null or amount >= 0),
  detail text not null, request text not null,
  status text not null default 'pendiente' check (status in ('pendiente','respondido')),
  response text, responded_at timestamptz,
  responded_by uuid references auth.users on delete set null,
  copy_sent_at timestamptz, response_sent_at timestamptz
);
create unique index complaints_code_idx on complaints (coalesce(gym_id, 0), code);
create index complaints_gym_created_idx on complaints (gym_id, created_at desc);
create index complaints_responded_by_idx on complaints (responded_by);
alter table complaints enable row level security;
create policy cp_r on complaints for select using (gym_id = (select my_gym()) and (select my_role()) = 'owner');
revoke all on complaints from anon;
revoke insert, update, delete, truncate, trigger, references on complaints from authenticated;

-- Crea la hoja con número correlativo por libro y año (ej. 0001-2026). Solo la llama el servidor (api/reclamos.js).
create function create_complaint(p jsonb, p_gym bigint default null) returns table(code text, created_at timestamptz, due_date date)
language plpgsql security definer set search_path=public as $$
#variable_conflict use_column
declare yr text := to_char(now() at time zone 'America/Lima', 'YYYY'); n int; c text;
        due date := add_business_days((now() at time zone 'America/Lima')::date, 15);
begin
  perform pg_advisory_xact_lock(hashtext('complaint:' || coalesce(p_gym::text, '0')));
  select coalesce(max(split_part(x.code, '-', 1)::int), 0) + 1 into n
    from complaints x where coalesce(x.gym_id, 0) = coalesce(p_gym, 0) and x.code like '%-' || yr;
  c := lpad(n::text, 4, '0') || '-' || yr;
  insert into complaints(gym_id, code, due_date, kind, consumer_name, doc_type, doc_number, address, phone, email, guardian_name, guardian_doc, service_desc, amount, detail, request)
  values (p_gym, c, due, p->>'kind', p->>'consumer_name', p->>'doc_type', p->>'doc_number', p->>'address', p->>'phone', p->>'email',
          nullif(p->>'guardian_name', ''), nullif(p->>'guardian_doc', ''), p->>'service_desc', nullif(p->>'amount', '')::numeric, p->>'detail', p->>'request');
  return query select cm.code, cm.created_at, cm.due_date from complaints cm where coalesce(cm.gym_id, 0) = coalesce(p_gym, 0) and cm.code = c;
end $$;
revoke execute on function create_complaint(jsonb, bigint) from public, anon, authenticated;
grant execute on function create_complaint(jsonb, bigint) to service_role;
revoke execute on function add_business_days(date, int) from public, anon;
