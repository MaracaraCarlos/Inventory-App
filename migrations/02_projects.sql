
-- Create projects table
create table projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add security policies for projects
alter table projects enable row level security;

create policy "Enable all access for all users" on projects
  for all using (true) with check (true);

-- Add project_id to products
alter table products 
add column project_id uuid references projects(id);

-- Create index for performance
create index idx_products_project_id on products(project_id);
