
-- Add details to projects table
alter table projects 
add column start_date date,
add column location text,
add column end_date date;

-- Add index for dates if needed
create index idx_projects_dates on projects(start_date, end_date);
