/*
  # Add new fields to registrations table

  1. Changes
    - Add new columns to registrations table:
      - `metropolitan` (text)
      - `district` (text)
      - `assembly` (text)

  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registrations' AND column_name = 'metropolitan'
  ) THEN
    ALTER TABLE registrations ADD COLUMN metropolitan text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registrations' AND column_name = 'district'
  ) THEN
    ALTER TABLE registrations ADD COLUMN district text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registrations' AND column_name = 'assembly'
  ) THEN
    ALTER TABLE registrations ADD COLUMN assembly text NOT NULL DEFAULT '';
  END IF;
END $$;