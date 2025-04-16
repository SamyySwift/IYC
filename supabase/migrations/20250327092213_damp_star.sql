/*
  # Create registrations and admin tables

  1. New Tables
    - `registrations`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `area` (text)
      - `expectations` (text)
      - `has_paid` (boolean)
      - `created_at` (timestamp)
    - `admins`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated admins to manage registrations
    - Add policy for public to create registrations
*/

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  area text NOT NULL,
  expectations text NOT NULL,
  has_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policies for registrations
CREATE POLICY "Allow public to create registrations"
  ON registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow admins to view registrations"
  ON registrations
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE auth.uid() = id
  ));

CREATE POLICY "Allow admins to update registrations"
  ON registrations
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE auth.uid() = id
  ));

CREATE POLICY "Allow admins to delete registrations"
  ON registrations
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE auth.uid() = id
  ));

-- Policies for admins
CREATE POLICY "Allow admins to view their own record"
  ON admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);