-- FORCE FIX for Appointments Visibility

-- 1. Enable RLS
alter table appointments enable row level security;

-- 2. Drop potentially conflicting policies
drop policy if exists "Users can view their own appointments" on appointments;
drop policy if exists "Doctors can view assigned appointments" on appointments;
drop policy if exists "Patients can view their own appointments" on appointments;
drop policy if exists "Select appointments" on appointments;

-- 3. Create a clean, comprehensive SELECT policy
create policy "View Appointments"
  on appointments for select
  using ( 
    auth.uid() = doctor_id 
    or auth.uid() = patient_id
    -- Also allow if the user is the 'doctor' of the patient linked to the appointment
    -- (This covers the case where a doctor views appointments of their managed patients)
    or exists (
      select 1 from patients 
      where patients.id = appointments.patient_id 
      and patients.doctor_id = auth.uid()
    )
  );

-- 4. Create INSERT policy (so they can continue booking)
drop policy if exists "Book Appointments" on appointments;
drop policy if exists "Users can book appointments" on appointments;

create policy "Book Appointments"
  on appointments for insert
  with check (
    auth.uid() = patient_id 
    or auth.uid() = doctor_id
    or exists (
        select 1 from patients 
        where patients.id = appointments.patient_id 
        and patients.doctor_id = auth.uid()
    )
  );

-- 5. Create UPDATE policy
drop policy if exists "Update Appointments" on appointments;
create policy "Update Appointments"
  on appointments for update
  using ( auth.uid() = doctor_id ); -- Only doctors can update status

-- 6. Ensure Foreign Key to Profiles exists (crucial for the join query in frontend)
-- We attempt to add it, but ignore if it fails (e.g. if column types mismatch, though they should be uuid)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_doctor_id_fkey') THEN
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_doctor_id_fkey 
    FOREIGN KEY (doctor_id) 
    REFERENCES profiles (id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add foreign key constraint (might already exist or types mismatch)';
END $$;
