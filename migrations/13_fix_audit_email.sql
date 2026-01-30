-- Add user_email column to audit_logs
alter table audit_logs add column user_email text;

-- Update the handle_audit_log function to capture email
create or replace function handle_audit_log()
returns trigger as $$
declare
  current_user_email text;
begin
  -- Try to get email from jwt (fastest)
  current_user_email := auth.jwt() ->> 'email';
  
  -- If not in JWT (e.g. server-side call), try fetching from auth.users
  if current_user_email is null then
    select email into current_user_email from auth.users where id = auth.uid();
  end if;

  insert into public.audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_by,
    user_email
  )
  values (
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id),
    TG_OP,
    case when TG_OP = 'DELETE' or TG_OP = 'UPDATE' then to_jsonb(OLD) else null end,
    case when TG_OP = 'INSERT' or TG_OP = 'UPDATE' then to_jsonb(NEW) else null end,
    auth.uid(),
    current_user_email
  );
  return null;
end;
$$ language plpgsql security definer;
