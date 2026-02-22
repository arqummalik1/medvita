-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase Auth)
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('doctor', 'patient', 'receptionist')) default 'patient',
  full_name text,
  employer_id uuid references auth.users(id), -- For receptionists to link to a doctor
  clinic_code text unique, -- For doctors to generate an invite code
  google_calendar_sync_enabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migration for existing tables
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'google_calendar_sync_enabled') then
    alter table profiles add column google_calendar_sync_enabled boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'employer_id') then
    alter table profiles add column employer_id uuid references auth.users(id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'clinic_code') then
    alter table profiles add column clinic_code text unique;
  end if;
end $$;

-- RLS for Profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Patients Table
create table if not exists patients (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  age integer,
  sex text,
  blood_pressure text, -- e.g. "120/80"
  heart_rate integer, -- e.g. 72
  email text, -- Added email for linking
  patient_id text unique default 'P-' || substring(md5(random()::text) from 1 for 6),
  doctor_id uuid references auth.users(id) not null,
  user_id uuid references auth.users(id) -- Optional direct link
);

-- Migration for new columns
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'patients' and column_name = 'blood_pressure') then
    alter table patients add column blood_pressure text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'patients' and column_name = 'heart_rate') then
    alter table patients add column heart_rate integer;
  end if;
end $$;

-- RLS for Patients
alter table patients enable row level security;

create policy "Doctors can view their own patients."
  on patients for select
  using ( auth.uid() = doctor_id );

create policy "Receptionists can view their employer's patients"
  on patients for select
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'receptionist' 
      and profiles.employer_id = patients.doctor_id
    )
  );

create policy "Doctors can insert patients."
  on patients for insert
  with check ( auth.uid() = doctor_id );

create policy "Receptionists can insert patients for their employer"
  on patients for insert
  with check (
    auth.uid() = doctor_id OR
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'receptionist' 
      and profiles.employer_id = patients.doctor_id
    )
  );

create policy "Doctors can update their own patients."
  on patients for update
  using ( auth.uid() = doctor_id );

create policy "Doctors can delete their own patients."
  on patients for delete
  using ( auth.uid() = doctor_id );

create policy "Patients can view their own record by email."
  on patients for select
  using ( email = auth.email() );

-- 3. Doctor Availability Table
create table if not exists doctor_availability (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references auth.users(id) not null,
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table doctor_availability enable row level security;

create policy "Doctors can manage their availability."
  on doctor_availability for all
  using ( auth.uid() = doctor_id );

create policy "Everyone can view doctor availability."
  on doctor_availability for select
  using ( true );

-- 4. Appointments Table
create table if not exists appointments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  patient_id uuid not null, -- Can be auth.users(id) or patients(id)
  patient_name text, -- Cache name for easier display
  doctor_id uuid references auth.users(id) not null,
  date date not null,
  time time not null,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled'))
);

-- Fix Foreign Key Constraint (Safety Check)
-- Ensure no conflicting FK exists on patient_id if it was created previously
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_patient_id_fkey') THEN
    ALTER TABLE appointments DROP CONSTRAINT appointments_patient_id_fkey;
  END IF;
END $$;

alter table appointments enable row level security;

-- Policies (Updated for visibility fixes)
drop policy if exists "Users can view their own appointments" on appointments;
drop policy if exists "Users can book appointments" on appointments;
drop policy if exists "Doctors can update appointments." on appointments;
drop policy if exists "View Appointments" on appointments;
drop policy if exists "Book Appointments" on appointments;
drop policy if exists "Update Appointments" on appointments;

-- Comprehensive SELECT policy
create policy "View Appointments"
  on appointments for select
  using ( 
    auth.uid() = doctor_id 
    or auth.uid() = patient_id
    -- Also allow if the user is the 'doctor' of the patient linked to the appointment
    or exists (
      select 1 from patients 
      where patients.id = appointments.patient_id 
      and patients.doctor_id = auth.uid()
    )
  );

-- INSERT policy
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

-- UPDATE policy
create policy "Update Appointments"
  on appointments for update
  using ( auth.uid() = doctor_id );

-- 5. Prescriptions Table
create table if not exists prescriptions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  patient_id uuid not null, -- Links to 'patients' table id
  doctor_id uuid references auth.users(id) not null,
  prescription_text text,
  file_url text
);

alter table prescriptions enable row level security;

create policy "Doctors can manage prescriptions."
  on prescriptions for all
  using ( auth.uid() = doctor_id );

create policy "Patients can view their prescriptions."
  on prescriptions for select
  using ( 
    exists (
      select 1 from patients 
      where patients.id = prescriptions.patient_id 
      and (patients.email = auth.email() or patients.user_id = auth.uid())
    )
  );

-- 6. Storage Setup
insert into storage.buckets (id, name, public) 
values ('medvita-files', 'medvita-files', true)
on conflict (id) do nothing;

create policy "Any authenticated user can upload files"
on storage.objects for insert
with check ( bucket_id = 'medvita-files' and auth.role() = 'authenticated' );

create policy "Any authenticated user can view files"
on storage.objects for select
using ( bucket_id = 'medvita-files' and auth.role() = 'authenticated' );

-- 7. Auto-create profile on new user
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text;
  v_clinic_code text;
  v_employer_id uuid;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'patient');
  v_clinic_code := new.raw_user_meta_data->>'clinic_code';
  
  -- If it's a receptionist and they provided a code, find the doctor
  if v_role = 'receptionist' and v_clinic_code is not null then
    select id into v_employer_id from public.profiles where clinic_code = v_clinic_code and role = 'doctor' limit 1;
  end if;

  insert into public.profiles (id, email, role, full_name, employer_id)
  values (
    new.id, 
    new.email, 
    v_role, 
    new.raw_user_meta_data->>'full_name',
    v_employer_id
  )
  on conflict (id) do update set 
    employer_id = EXCLUDED.employer_id;
    
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
