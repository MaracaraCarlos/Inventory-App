-- Drop existing check constraint
ALTER TABLE public.movements DROP CONSTRAINT IF EXISTS movements_type_check;

-- Create new check constraint including 'TRANSFER'
ALTER TABLE public.movements ADD CONSTRAINT movements_type_check CHECK (type IN ('IN', 'OUT', 'TRANSFER'));
