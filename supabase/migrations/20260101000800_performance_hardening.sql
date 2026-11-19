-- Rendimiento y permisos (aplicada tras la revisión de la app)
create index attendance_gym_day_idx on attendance(gym_id, day);
create index classes_gym_idx on classes(gym_id);
create index member_credentials_gym_idx on member_credentials(gym_id);
create index member_credentials_member_idx on member_credentials(member_id);
create index members_plan_idx on members(plan_id);
create index payments_gym_paid_idx on payments(gym_id, paid_on);
create index payments_member_idx on payments(member_id);
create index profiles_gym_idx on profiles(gym_id);
create index support_tickets_gym_idx on support_tickets(gym_id);
create index support_tickets_user_idx on support_tickets(user_id);

drop policy plans_w on plans;
create policy plans_i on plans for insert with check (gym_id = (select my_gym()) and (select my_role()) = 'owner');
create policy plans_u on plans for update using (gym_id = (select my_gym()) and (select my_role()) = 'owner') with check (gym_id = (select my_gym()) and (select my_role()) = 'owner');
create policy plans_d on plans for delete using (gym_id = (select my_gym()) and (select my_role()) = 'owner');
drop policy cls_w on classes;
create policy cls_i on classes for insert with check (gym_id = (select my_gym()) and (select my_role()) = 'owner');
create policy cls_u on classes for update using (gym_id = (select my_gym()) and (select my_role()) = 'owner') with check (gym_id = (select my_gym()) and (select my_role()) = 'owner');
create policy cls_d on classes for delete using (gym_id = (select my_gym()) and (select my_role()) = 'owner');

drop policy prof_u on profiles;
create policy prof_u on profiles for update using (user_id = (select auth.uid()));
drop policy prof_r on profiles;
create policy prof_r on profiles for select using (user_id = (select auth.uid()) or (gym_id = (select my_gym()) and (select my_role()) = 'owner'));
drop policy tk_r on support_tickets;
create policy tk_r on support_tickets for select using (gym_id = (select my_gym()) and (user_id = (select auth.uid()) or (select my_role()) = 'owner'));
drop policy tk_i on support_tickets;
create policy tk_i on support_tickets for insert with check (gym_id = (select my_gym()) and user_id = (select auth.uid()));

revoke truncate, trigger, references on all tables in schema public from anon, authenticated;

create function member_secrets(p_member bigint) returns table(qr_token text, enroll_token text)
language plpgsql stable security definer set search_path=public as $$
declare g bigint := need_role(array['owner','reception']);
begin
  return query select m.qr_token, m.enroll_token from members m where m.id = p_member and m.gym_id = g;
end $$;
revoke execute on function member_secrets(bigint) from public, anon;
grant execute on function member_secrets(bigint) to authenticated;
