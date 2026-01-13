-- Add group_number column to registrations table
ALTER TABLE public.registrations 
ADD COLUMN group_number SMALLINT;

-- Add constraint to ensure group_number is between 1 and 4
ALTER TABLE public.registrations
ADD CONSTRAINT check_group_number CHECK (group_number BETWEEN 1 AND 4);
