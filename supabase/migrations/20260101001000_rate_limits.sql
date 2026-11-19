-- Límite de intentos para las rutas públicas de api/ (se llama solo desde el servidor con service_role)
create table rate_limits(key text primary key, window_start timestamptz not null default now(), hits int not null default 0);
alter table rate_limits enable row level security;  -- sin políticas: solo service_role

-- Cuenta un intento. Devuelve true si todavía está dentro del máximo de la ventana.
create function rate_limit_hit(p_key text, p_max int, p_window int) returns boolean
language plpgsql security definer set search_path=public as $$
declare h int;
begin
  if random() < 0.02 then delete from rate_limits where window_start < now() - interval '1 day'; end if;
  insert into rate_limits(key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when rate_limits.window_start < now() - make_interval(secs => p_window) then 1 else rate_limits.hits + 1 end,
    window_start = case when rate_limits.window_start < now() - make_interval(secs => p_window) then now() else rate_limits.window_start end
  returning hits into h;
  return h <= p_max;
end $$;

-- Consulta sin contar: true si la clave ya alcanzó el máximo en la ventana actual.
create function rate_limit_blocked(p_key text, p_max int, p_window int) returns boolean
language sql stable security definer set search_path=public as $$
  select coalesce((select hits >= p_max and window_start >= now() - make_interval(secs => p_window) from rate_limits where key = p_key), false)
$$;

revoke execute on function rate_limit_hit(text,int,int), rate_limit_blocked(text,int,int) from public, anon, authenticated;
grant execute on function rate_limit_hit(text,int,int), rate_limit_blocked(text,int,int) to service_role;
