create function create_gym(p_name text) returns bigint language plpgsql security definer set search_path=public as $$
declare g bigint;
begin
  if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
  if exists(select 1 from profiles where user_id=auth.uid()) then raise exception 'Tu usuario ya pertenece a un gimnasio.'; end if;
  insert into gyms(name) values (trim(p_name)) returning id into g;
  insert into profiles(user_id,gym_id,role) values (auth.uid(),g,'owner');
  insert into plans(gym_id,name,days,price) values (g,'Pase diario',1,10),(g,'Mensual',30,80),(g,'Trimestral',90,210),(g,'Semestral',180,380),(g,'Anual',365,650);
  insert into classes(gym_id,name,days,at_time,coach,capacity,sort) values
   (g,'Funcional','Lun / Mié / Vie','06:00','Carlos',20,1),(g,'Spinning','Lun / Mié / Vie','18:30','Andrea',15,2),(g,'Yoga','Mar / Jue','07:00','Lucía',18,3),
   (g,'Crossfit','Mar / Jue','19:00','Diego',16,4),(g,'Zumba','Sáb','09:00','Marisol',25,5),(g,'Boxeo','Sáb','11:00','Renzo',12,6);
  return g;
end $$;

create function register_member(p_name text,p_dni text,p_phone text,p_plan bigint,p_method text) returns bigint language plpgsql security definer set search_path=public as $$
declare g bigint := need_role(array['owner','reception']); pl plans; nid bigint;
begin
  select * into pl from plans where plans.id=p_plan and gym_id=g and active;
  if not found then raise exception 'Plan no válido.'; end if;
  insert into members(gym_id,name,dni,phone,plan_id,plan_name,start_date,end_date)
    values (g,trim(p_name),p_dni,p_phone,pl.id,pl.name,gym_today(),gym_today()+pl.days-1) returning members.id into nid;
  insert into payments(gym_id,member_id,plan_name,amount,method) values (g,nid,pl.name,pl.price,p_method);
  return nid;
exception when unique_violation then raise exception 'Ya existe un miembro con ese DNI.';
end $$;

create function renew_member(p_member bigint,p_plan bigint,p_method text) returns date language plpgsql security definer set search_path=public as $$
declare g bigint := need_role(array['owner','reception']); pl plans; m members; base date; ne date;
begin
  select * into pl from plans where plans.id=p_plan and gym_id=g and active; if not found then raise exception 'Plan no válido.'; end if;
  select * into m from members where members.id=p_member and gym_id=g; if not found then raise exception 'Miembro no encontrado.'; end if;
  base := greatest(coalesce(m.end_date+1, gym_today()), gym_today()); ne := base+pl.days-1;
  update members set plan_id=pl.id, plan_name=pl.name, start_date=base, end_date=ne where members.id=m.id;
  insert into payments(gym_id,member_id,plan_name,amount,method) values (g,m.id,pl.name,pl.price,p_method);
  return ne;
end $$;

create function check_in(p_member bigint, p_via text default 'manual', p_extra text default null) returns text language plpgsql security definer set search_path=public as $$
declare g bigint := need_role(array['owner','reception','trainer']); m members; mid bigint := p_member;
begin
  if p_via='qr' then
    begin mid := split_part(p_extra,':',2)::bigint; exception when others then raise exception 'QR no válido.'; end;
    select * into m from members where members.id=mid and gym_id=g and qr_token=split_part(p_extra,':',3) and split_part(p_extra,':',1)='GYMXIO';
    if not found then raise exception 'QR no válido. Genera el carnet de nuevo.'; end if;
  elsif p_via='bio' then
    select mm.* into m from members mm join member_credentials c on c.member_id=mm.id where c.credential_id=p_extra and mm.gym_id=g;
    if not found then raise exception 'Biometría no reconocida. Vincúlala desde el carnet.'; end if;
  else
    select * into m from members where members.id=mid and gym_id=g; if not found then raise exception 'Miembro no encontrado.'; end if;
  end if;
  if m.end_date is null or m.end_date < gym_today() then raise exception 'Membresía vencida. Renueva para registrar el ingreso.'; end if;
  insert into attendance(gym_id,member_id,via) values (g,m.id,p_via) on conflict (member_id,day) do nothing;
  if not found then raise exception '% ya ingresó hoy.', m.name; end if;
  return m.name;
end $$;

create function register_credential(p_member bigint, p_cred text) returns void language plpgsql security definer set search_path=public as $$
declare g bigint := need_role(array['owner','reception']);
begin
  perform 1 from members where members.id=p_member and gym_id=g; if not found then raise exception 'Miembro no encontrado.'; end if;
  insert into member_credentials(gym_id,member_id,credential_id) values (g,p_member,p_cred)
    on conflict (credential_id) do update set member_id=excluded.member_id;
  update members set has_bio=true where members.id=p_member;
end $$;

-- El dueño agrega personal: primero crea el usuario en Authentication > Users, luego: select add_staff('correo','reception','Nombre');
create function add_staff(p_email text, p_role text, p_name text default null) returns void language plpgsql security definer set search_path=public as $$
declare g bigint := need_role(array['owner']); uid uuid;
begin
  if p_role not in ('reception','trainer') then raise exception 'Rol no válido.'; end if;
  select id into uid from auth.users where lower(email)=lower(p_email);
  if uid is null then raise exception 'Ese correo aún no tiene cuenta.'; end if;
  insert into profiles(user_id,gym_id,role,full_name) values (uid,g,p_role,p_name) on conflict (user_id) do nothing;
  if not found then raise exception 'Ese usuario ya pertenece a un gimnasio.'; end if;
end $$;

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
