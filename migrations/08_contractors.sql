-- Create contractors table
CREATE TABLE IF NOT EXISTS contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON contractors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON contractors
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON contractors
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users" ON contractors
    FOR DELETE
    TO authenticated
    USING (true);
