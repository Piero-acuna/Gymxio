-- Endurecimiento sugerido por el linter de Supabase
revoke execute on function set_profile_email() from public, anon, authenticated;  -- es de trigger, no debe ser una RPC
alter function gym_today() set search_path = public;
