-- Add user_id and user_email columns to movements table
ALTER TABLE movements 
ADD COLUMN user_id UUID REFERENCES auth.users(id),
ADD COLUMN user_email TEXT;

-- Optional: Create index for better performance
CREATE INDEX idx_movements_user_id ON movements(user_id);
