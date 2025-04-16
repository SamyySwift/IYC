-- Add the gender column to the registrations table
alter table public.registrations
add column gender text;

-- Add a check constraint to ensure only 'Male' or 'Female' can be inserted (optional but recommended)
-- This prevents invalid data from being saved.
alter table public.registrations
add constraint registrations_gender_check check (gender in ('Male', 'Female'));

-- Optional: Add a comment to the column for clarity
comment on column public.registrations.gender is 'Gender of the registrant';

-- Note: If you need to allow NULL values initially or handle existing rows,
-- you might adjust the constraint or add an update statement.
-- For new setups, this should be fine.