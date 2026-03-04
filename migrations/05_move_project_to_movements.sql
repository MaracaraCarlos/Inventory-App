-- Add project_id and from_project_id to movements table
ALTER TABLE public.movements 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
ADD COLUMN IF NOT EXISTS from_project_id UUID REFERENCES public.projects(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movements_project_id ON public.movements(project_id);
CREATE INDEX IF NOT EXISTS idx_movements_from_project_id ON public.movements(from_project_id);

-- Add logic to handle 'TRANSFER' type if needed in valid constraints, 
-- though currently 'type' is likely a text field or enum. 
-- If 'type' has a check constraint, we might need to update it.
-- Checking constraint if exists (assuming it might be a text field without strict enum constraint for now based on previous files)
-- If there was a check constraint for type IN ('IN', 'OUT'), we would need to drop and recreate it.
-- ALTER TABLE public.movements DROP CONSTRAINT IF EXISTS movements_type_check;
-- ALTER TABLE public.movements ADD CONSTRAINT movements_type_check CHECK (type IN ('IN', 'OUT', 'TRANSFER'));
