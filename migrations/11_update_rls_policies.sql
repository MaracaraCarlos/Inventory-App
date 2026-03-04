-- Helper function to check user role
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer;

-- --- PRODUCTS ---
-- Everyone (Authenticated) can view products
-- Only Admin and Supervisor can insert/update/delete products (Wait, Supervisors can't delete critical data? Let's check plan)
-- Plan: Products: Creating (Admin, Supervisor). Editing (Admin, Supervisor). Deleting (Admin).

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;

CREATE POLICY "Read products" ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insert products" ON products FOR INSERT TO authenticated 
WITH CHECK ( get_my_role() IN ('admin', 'supervisor') );

CREATE POLICY "Update products" ON products FOR UPDATE TO authenticated 
USING ( get_my_role() IN ('admin', 'supervisor') );

CREATE POLICY "Delete products" ON products FOR DELETE TO authenticated 
USING ( get_my_role() = 'admin' );


-- --- PROJECTS ---
-- Plan: Projects: Creating (Admin, Supervisor). Editing (Admin, Supervisor). Deleting (Admin).

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON projects;

CREATE POLICY "Read projects" ON projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insert projects" ON projects FOR INSERT TO authenticated 
WITH CHECK ( get_my_role() IN ('admin', 'supervisor') );

CREATE POLICY "Update projects" ON projects FOR UPDATE TO authenticated 
USING ( get_my_role() IN ('admin', 'supervisor') );

CREATE POLICY "Delete projects" ON projects FOR DELETE TO authenticated 
USING ( get_my_role() = 'admin' );


-- --- MOVEMENTS ---
-- Plan: Movements: Creating (Admin, Supervisor, Operator). Reader NO.
-- Editing/Deleting is usually not allowed or restricted but we have CRUD.
-- Let's say Edit/Delete movements is Admin only? Or Admin+Supervisor?
-- Usually inventory history shouldn't be touched. But if we allow it:
-- Insert: Admin, Supervisor, Operator.

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON movements;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON movements;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON movements;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON movements;

CREATE POLICY "Read movements" ON movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insert movements" ON movements FOR INSERT TO authenticated 
WITH CHECK ( get_my_role() IN ('admin', 'supervisor', 'operator') );

CREATE POLICY "Update movements" ON movements FOR UPDATE TO authenticated 
USING ( get_my_role() = 'admin' ); -- Only Admin can edit history for safety

CREATE POLICY "Delete movements" ON movements FOR DELETE TO authenticated 
USING ( get_my_role() = 'admin' ); -- Only Admin can delete history


-- --- SUPPLIERS & CONTRACTORS ---
-- Plan: Creating/Editing (Admin, Supervisor). Deleting (Admin).

-- Suppliers
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON suppliers;

CREATE POLICY "Read suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK ( get_my_role() IN ('admin', 'supervisor') );
CREATE POLICY "Update suppliers" ON suppliers FOR UPDATE TO authenticated USING ( get_my_role() IN ('admin', 'supervisor') );
CREATE POLICY "Delete suppliers" ON suppliers FOR DELETE TO authenticated USING ( get_my_role() = 'admin' );

-- Contractors
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON contractors;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON contractors;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON contractors;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON contractors;

CREATE POLICY "Read contractors" ON contractors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert contractors" ON contractors FOR INSERT TO authenticated WITH CHECK ( get_my_role() IN ('admin', 'supervisor') );
CREATE POLICY "Update contractors" ON contractors FOR UPDATE TO authenticated USING ( get_my_role() IN ('admin', 'supervisor') );
CREATE POLICY "Delete contractors" ON contractors FOR DELETE TO authenticated USING ( get_my_role() = 'admin' );
