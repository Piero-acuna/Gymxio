-- Al eliminar un miembro se conservan sus pagos (contabilidad); su asistencia y credenciales sí se borran.
-- Las fotos del Storage las borra la app con la API de Storage (borrar filas de storage.objects por SQL deja los archivos huérfanos).
alter table payments add column member_name text;
update payments p set member_name = m.name from members m where m.id = p.member_id;
alter table payments alter column member_id drop not null;
alter table payments drop constraint payments_member_id_fkey;
alter table payments add constraint payments_member_id_fkey foreign key (member_id) references members(id) on delete set null;

create function set_payment_member_name() returns trigger language plpgsql set search_path=public as $$
begin
  if new.member_name is null and new.member_id is not null then select name into new.member_name from members where id = new.member_id; end if;
  return new;
end $$;
create trigger payments_member_name before insert on payments for each row execute function set_payment_member_name();
