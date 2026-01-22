-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('doctor', 'patient')) default 'patient',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
create table patients (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  age integer,
  sex text,
  email text, -- Added email for linking
  patient_id text unique default 'P-' || substring(md5(random()::text) from 1 for 6),
  doctor_id uuid references auth.users(id) not null,
  user_id uuid references auth.users(id) -- Optional direct link
);

-- RLS for Patients
alter table patients enable row level security;

create policy "Doctors can view their own patients."
  on patients for select
  using ( auth.uid() = doctor_id );

create policy "Doctors can insert patients."
  on patients for insert
  with check ( auth.uid() = doctor_id );

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
create table doctor_availability (
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
create table appointments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  patient_id uuid references auth.users(id) not null,
  doctor_id uuid references auth.users(id) not null,
  date date not null,
  time time not null,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled'))
);

alter table appointments enable row level security;

create policy "Users can view their own appointments."
  on appointments for select
  using ( auth.uid() = patient_id or auth.uid() = doctor_id );

create policy "Patients can book appointments."
  on appointments for insert
  with check ( auth.uid() = patient_id );

create policy "Doctors can update appointments."
  on appointments for update
  using ( auth.uid() = doctor_id );

-- 5. Prescriptions Table
create table prescriptions (
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

-- Storage Setup (Run these manually if needed or via dashboard)
-- insert into storage.buckets (id, name, public) values ('medvita-files', 'medvita-files', true);

-- Storage Policies
-- create policy "Any authenticated user can upload files"
-- on storage.objects for insert
-- with check ( bucket_id = 'medvita-files' and auth.role() = 'authenticated' );

-- create policy "Any authenticated user can view files"
-- on storage.objects for select
-- using ( bucket_id = 'medvita-files' and auth.role() = 'authenticated' );
