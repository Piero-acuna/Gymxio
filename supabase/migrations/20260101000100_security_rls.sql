-- RLS: cada gimnasio solo ve lo suyo
alter table gyms enable row level security; alter table profiles enable row level security; alter table plans enable row level security;
alter table members enable row level security; alter table member_credentials enable row level security; alter table payments enable row level security;
alter table attendance enable row level security; alter table classes enable row level security;
create policy gyms_r on gyms for select using (id=my_gym());
create policy prof_r on profiles for select using (gym_id=my_gym());
create policy plans_r on plans for select using (gym_id=my_gym());
create policy plans_w on plans for all using (gym_id=my_gym() and my_role()='owner') with check (gym_id=my_gym() and my_role()='owner');
create policy mem_r on members for select using (gym_id=my_gym());
create policy mem_u on members for update using (gym_id=my_gym() and my_role() in ('owner','reception'));
create policy mem_d on members for delete using (gym_id=my_gym() and my_role()='owner');
create policy pay_r on payments for select using (gym_id=my_gym() and my_role() in ('owner','reception'));
create policy att_r on attendance for select using (gym_id=my_gym());
create policy cls_r on classes for select using (gym_id=my_gym());
create policy cls_w on classes for all using (gym_id=my_gym() and my_role()='owner') with check (gym_id=my_gym() and my_role()='owner');
-- members: el cliente solo edita datos personales; vencimientos y pagos van por funciones
revoke update on members from authenticated; grant update(name,dni,phone) on members to authenticated;
revoke all on all tables in schema public from anon;
