## Step 4: Fix Foreign Key Constraint (Important)
If you encounter errors related to "foreign key constraint" when booking appointments as a patient, run this additional script. This resolves the issue where `patient_id` can be either a registered user UUID or a doctor-managed patient UUID.

```sql
-- Fix Foreign Key Constraint on Appointments table
DO $$ 
BEGIN
  -- Try to drop the constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_patient_id_fkey') THEN
    ALTER TABLE appointments DROP CONSTRAINT appointments_patient_id_fkey;
  END IF;
END $$;

-- Ensure patient_name column exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'patient_name') THEN
    ALTER TABLE appointments ADD COLUMN patient_name text;
  END IF;
END $$;
```
