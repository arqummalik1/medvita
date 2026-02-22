-- Fix Foreign Key Constraint on Appointments table
-- This is necessary because appointments.patient_id can store either:
-- 1. A registered user's UUID (auth.users.id)
-- 2. A doctor-managed patient's UUID (patients.id)
-- A standard foreign key cannot reference two different tables.

DO $$ 
BEGIN
  -- Try to drop the constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_patient_id_fkey') THEN
    ALTER TABLE appointments DROP CONSTRAINT appointments_patient_id_fkey;
  END IF;
END $$;

-- Also ensure patient_name column exists (just in case)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'patient_name') THEN
    ALTER TABLE appointments ADD COLUMN patient_name text;
  END IF;
END $$;
