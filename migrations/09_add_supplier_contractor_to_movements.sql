-- Add supplier_id and contractor_id columns to movements table
ALTER TABLE movements
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_movements_supplier_id ON movements(supplier_id);
CREATE INDEX IF NOT EXISTS idx_movements_contractor_id ON movements(contractor_id);
