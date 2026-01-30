-- Create audit_logs table
create table audit_logs (
  id uuid default uuid_generate_v4() primary key,
  table_name text not null,
  record_id uuid, -- Can be null if record deleted and we only want to log it happened, but usually we keep the ID
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table audit_logs enable row level security;

-- Policy: Only Admins can view audit logs
create policy "Admins can view audit logs"
  on audit_logs
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Policy: Only Admins can delete audit logs
create policy "Admins can delete audit logs"
  on audit_logs
  for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Policy: Triggers/Server can insert (Users cannot manually insert via API usually, but triggers run with security definer often)
-- For simplicity, we allow insert if authenticated, but triggers handle the actual data.
-- Actually, triggers executing as security definer bypass RLS, so we don't strictly need an INSERT policy for the *trigger* to work if the function is security definer.
-- However, we don't want users manually inserting fake logs.
create policy "No manual inserts"
  on audit_logs
  for insert
  with check (false);


-- Function to handle audit logging
create or replace function handle_audit_log()
returns trigger as $$
begin
  insert into public.audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_by
  )
  values (
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id),
    TG_OP,
    case when TG_OP = 'DELETE' or TG_OP = 'UPDATE' then to_jsonb(OLD) else null end,
    case when TG_OP = 'INSERT' or TG_OP = 'UPDATE' then to_jsonb(NEW) else null end,
    auth.uid()
  );
  return null;
end;
$$ language plpgsql security definer;

-- Triggers for Products
create trigger audit_products_trigger
after insert or update or delete on products
for each row execute function handle_audit_log();

-- Triggers for Projects
create trigger audit_projects_trigger
after insert or update or delete on projects
for each row execute function handle_audit_log();

-- Triggers for Movements
create trigger audit_movements_trigger
after insert or update or delete on movements
for each row execute function handle_audit_log();

-- Triggers for Suppliers
create trigger audit_suppliers_trigger
after insert or update or delete on suppliers
for each row execute function handle_audit_log();

-- Triggers for Contractors
create trigger audit_contractors_trigger
after insert or update or delete on contractors
for each row execute function handle_audit_log();
