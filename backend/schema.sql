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

-- 7. Performance Indexes (critical for 100k+ patients)
create index if not exists idx_patients_doctor_id on patients(doctor_id);
create index if not exists idx_patients_email on patients(email);
create index if not exists idx_patients_user_id on patients(user_id);
create index if not exists idx_appointments_doctor_id on appointments(doctor_id);
create index if not exists idx_appointments_patient_id on appointments(patient_id);
create index if not exists idx_appointments_date on appointments(date);
create index if not exists idx_appointments_doctor_date on appointments(doctor_id, date);
create index if not exists idx_appointments_status on appointments(status);
create index if not exists idx_prescriptions_patient_id on prescriptions(patient_id);
create index if not exists idx_prescriptions_doctor_id on prescriptions(doctor_id);
create index if not exists idx_doctor_availability_doctor_id on doctor_availability(doctor_id);
create index if not exists idx_profiles_clinic_code on profiles(clinic_code);
create index if not exists idx_profiles_employer_id on profiles(employer_id);
create index if not exists idx_profiles_role on profiles(role);

-- 8. Auto-create profile on new user
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
    select id into v_employer_id from public.profiles where clinic_code = v_clinic_code and role = 'doctor' order by created_at asc limit 1;
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

-- ============================================================
-- 9. Subscription System Tables
-- ============================================================

-- Add subscription fields to profiles
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'subscription_plan') then
    alter table profiles add column subscription_plan text default 'free' check (subscription_plan in ('free', 'pro'));
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'subscription_status') then
    alter table profiles add column subscription_status text default 'active' check (subscription_status in ('active', 'expired', 'cancelled'));
  end if;
end $$;

-- Subscription Plans (definitions)
create table if not exists subscription_plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null check (name in ('free', 'pro')),
  display_name text not null,
  description text,
  price_inr integer not null default 0, -- in paisa (e.g. 99900 = ₹999)
  billing_cycle text check (billing_cycle in ('monthly', 'annual')) default 'monthly',
  feature_limits jsonb not null default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed default plans
insert into subscription_plans (name, display_name, description, price_inr, billing_cycle, feature_limits) values
  ('free', 'Standard', 'Basic features for getting started', 0, 'monthly',
   '{"max_patients": 10, "max_appointments_per_month": 20, "max_prescriptions_per_month": 10, "max_receptionists": 0, "earnings_access": false, "chatbot_access": false, "email_prescriptions": false}'::jsonb),
  ('pro', 'Professional', 'Full access to all features', 99900, 'monthly',
   '{"max_patients": -1, "max_appointments_per_month": -1, "max_prescriptions_per_month": -1, "max_receptionists": 3, "earnings_access": true, "chatbot_access": true, "email_prescriptions": true}'::jsonb)
on conflict do nothing;

-- User Subscriptions (tracks active subscription per doctor)
create table if not exists user_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id uuid references subscription_plans(id) not null,
  status text default 'active' check (status in ('active', 'expired', 'cancelled', 'pending')),
  razorpay_subscription_id text unique,
  razorpay_customer_id text,
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone,
  next_billing_date timestamp with time zone,
  auto_renew boolean default true,
  cancel_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_user_subscriptions_user_id on user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_status on user_subscriptions(status);

-- Transactions (payment records)
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription_id uuid references user_subscriptions(id),
  razorpay_payment_id text unique,
  amount_inr integer not null, -- in paisa
  currency text default 'INR',
  status text default 'pending' check (status in ('success', 'pending', 'failed', 'refunded')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_transactions_user_id on transactions(user_id);

-- Feature Usage (monthly counters for free tier enforcement)
create table if not exists feature_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  feature_name text not null,
  usage_count integer default 0,
  period_start date not null default date_trunc('month', current_date)::date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, feature_name, period_start)
);

create index if not exists idx_feature_usage_user_period on feature_usage(user_id, period_start);

-- RLS for subscription tables
alter table subscription_plans enable row level security;
alter table user_subscriptions enable row level security;
alter table transactions enable row level security;
alter table feature_usage enable row level security;

-- Everyone can read plans
create policy "Anyone can view subscription plans"
  on subscription_plans for select
  using (true);

-- Users can only see their own subscription
create policy "Users can view their own subscriptions"
  on user_subscriptions for select
  using (auth.uid() = user_id);

-- Users can only see their own transactions
create policy "Users can view their own transactions"
  on transactions for select
  using (auth.uid() = user_id);

-- Users can see their own usage
create policy "Users can view their own usage"
  on feature_usage for select
  using (auth.uid() = user_id);

-- Service role can manage all (for edge functions)
create policy "Service role manages subscriptions"
  on user_subscriptions for all
  using (auth.role() = 'service_role');

create policy "Service role manages transactions"
  on transactions for all
  using (auth.role() = 'service_role');

create policy "Service role manages usage"
  on feature_usage for all
  using (auth.role() = 'service_role');
