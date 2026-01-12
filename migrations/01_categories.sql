-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add category_id to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Insert existing unique categories from products into categories table
INSERT INTO public.categories (name)
SELECT DISTINCT category 
FROM public.products 
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;

-- Update products to link to the new categories
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category = c.name;

-- Optional: You might want to remove the old category column later, 
-- but for now we will keep it or ignore it in the frontend.
-- ALTER TABLE public.products DROP COLUMN category;

-- Enable RLS (Row Level Security) for categories if you have it enabled for other tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies (Adjust based on your auth needs - creating generic policies here)
CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.categories FOR DELETE USING (auth.role() = 'authenticated');
