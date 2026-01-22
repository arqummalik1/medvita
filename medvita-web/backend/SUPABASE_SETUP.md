# Supabase Database Setup Instructions

The error `Could not find the table 'public.profiles'` indicates that your Supabase database is missing the required tables. This is common when setting up a new project.

Please follow these steps to initialize your database:

1.  **Log in to Supabase**: Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and select your project (`medvita`).
2.  **Open SQL Editor**: In the left sidebar, click on the **SQL Editor** icon (it looks like a terminal `>_`).
3.  **New Query**: Click **+ New Query**.
4.  **Paste Schema**: Copy the entire content of the code block below and paste it into the query editor.
5.  **Run**: Click the **Run** button (bottom right of the editor).

## SQL Schema to Run

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase Auth)
create table if not exists profiles (
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
create table if not exists patients (
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
-- Note: You might need to create the bucket manually in the dashboard if this fails
insert into storage.buckets (id, name, public) 
values ('medvita-files', 'medvita-files', true)
on conflict (id) do nothing;

create policy "Any authenticated user can upload files"
on storage.objects for insert
with check ( bucket_id = 'medvita-files' and auth.role() = 'authenticated' );

create policy "Any authenticated user can view files"
on storage.objects for select
using ( bucket_id = 'medvita-files' and auth.role() = 'authenticated' );
```

### Auto-create profiles on signup
If your project requires email confirmation (recommended), the client may not have a session immediately after signup and cannot insert into `profiles`. Add this trigger so profiles are created automatically for every new user:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, new.email, 'patient', null)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

### Backfill profiles for existing users
If you already have users and the `profiles` table is empty, run this once to populate profiles for all existing auth users:

```sql
insert into public.profiles (id, email, role, full_name)
select u.id, u.email, 'patient', null
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
```
