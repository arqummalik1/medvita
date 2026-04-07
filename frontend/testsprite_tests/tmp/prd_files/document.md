# MedVita — Product Specification Document (PSD)
**Version:** 1.0  
**Date:** February 2026  
**Status:** In Development (Active)  
**Prepared By:** Engineering Team

---

## 1. Product Overview

### 1.1 Executive Summary

**MedVita** is a modern, web-based Healthcare Management System (HMS) designed for small-to-medium clinics. It enables doctors, patients, and reception staff to seamlessly manage the full lifecycle of a clinical visit — from walk-in patient registration and live queue management, to appointment scheduling, prescription generation, and medical history review — all within a single, cohesive platform.

### 1.2 Problem Statement

Small private clinics and independent practitioners currently manage their workflows using a fragmented set of tools: paper registers for walk-in queues, WhatsApp for appointment booking, and handwritten or generic-template prescriptions. This results in:

- **Lost patient records** and no searchable medical history
- **No coordination** between reception staff and the treating doctor
- **No digital prescriptions** — patients must revisit for replacements
- **Zero analytics** on practice growth, patient volume, or trends

MedVita solves all of the above in one unified platform.

### 1.3 Vision

> "A clinic OS that makes the doctor more effective, patients more informed, and reception smarter — all in the time it takes to open a browser tab."

### 1.4 Out of Scope (v1.0)

- Insurance / billing / invoicing
- Multi-branch clinic support
- Telemedicine / video consultations
- Lab order management
- Mobile native apps (iOS/Android)

---

## 2. Target Users & Personas

MedVita has **three distinct user roles**, each with a dedicated experience.

| Role | Who They Are | Primary Goal |
|---|---|---|
| **Doctor** | Clinic owner / treating physician | Manage patients, schedule, prescriptions, and analytics |
| **Patient** | Individual who visits the clinic | Book appointments, view prescriptions, track history |
| **Receptionist** | Front-desk clinic staff | Register walk-in patients and manage the daily queue |

### 2.1 Persona — Dr. Ahmed (Doctor)

- Runs a private general practice
- Sees 20–40 patients a day
- Needs: quick access to patient history, live queue monitor, and printable prescriptions
- Pain point: Paper chaos; patients call for prescription duplicates

### 2.2 Persona — Sara (Patient)

- Visits Dr. Ahmed's clinic 2–3× per year
- Needs: Easy appointment booking and digital access to her prescriptions
- Pain point: Drives to clinic just to collect a prescription slip

### 2.3 Persona — Bilal (Receptionist)

- Manages front desk for Dr. Ahmed's clinic
- Needs: Fast walk-in registration with vitals, send directly to doctor's queue
- Pain point: Separate paper register becomes chaotic mid-day

---

## 3. System Architecture Overview

```
Landing Page → Auth (Login / Signup)
                    ↓
            Protected Dashboard
                    ↓
    ┌───────────────┼───────────────┐
  Doctor        Patient       Receptionist
  Dashboard     Dashboard      Dashboard
    │               │
  Patients   Appointments
  Manager      Viewer
  Appointments Prescriptions
  Manager       Viewer
  Prescriptions  Chatbot
  Manager
  Analytics
  Settings
```

### 3.1 Data Flow (MVVM-style)

```
UI Component → Supabase JS Client (Repository) → PostgreSQL (via RLS)
                     ↓
             Realtime WebSocket Channel
                     ↓
              UI auto-updates (no polling)
```

---

## 4. Authentication & Authorization

### 4.1 Authentication

- **Provider:** Supabase Auth (Email/Password)
- **Session persistence:** Managed by Supabase client (`onAuthStateChange`)
- **Protected routes:** All `/dashboard/*` routes guarded by `ProtectedRoute` component which checks session validity before rendering
- **Loading state:** Spinner shown while session resolves; no flash of unauthorized content

### 4.2 Role-Based Authorization

Each user profile has a `role` field in the `profiles` table. Access is enforced at two levels:

| Level | Mechanism |
|---|---|
| **UI-level** | Dashboard layout and navigation items render based on `profile.role` |
| **Database-level** | Row Level Security (RLS) policies on all tables restrict read/write by `auth.uid()` and role |

**Role detection on login:**
- If `role === 'doctor'` → redirect to `/dashboard/home` (Doctor view)
- If `role === 'patient'` → redirect to `/dashboard/home` (Patient view)
- If `role === 'receptionist'` → redirect to `/dashboard/reception` (Reception view)

### 4.3 Clinic Code System (Receptionist Linking)

To prevent unauthorized accounts from masquerading as clinic staff:

1. **Doctor** generates a unique **6-character alphanumeric Clinic Code** from Settings
2. **Receptionist** enters this code during signup
3. The system links `receptionist.employer_id = doctor.user_id`
4. All reception data (queue entries) is written against `employer_id`, ensuring data isolation between clinics

---

## 5. Feature Modules

---

### 5.1 Module: Landing Page

**Route:** `/` (public)

**Purpose:** Marketing entry point with conversion to signup/login.

**Features:**
- Hero section with product value proposition
- Feature highlights (for doctors, patients)
- CTA buttons: "Get Started" and "Login"
- Responsive layout (mobile-first)

---

### 5.2 Module: Authentication

**Routes:** `/login`, `/signup`, `/signup/receptionist`

#### 5.2.1 Login

- Email + password form
- Forgot password support (via Supabase's built-in flow)
- Role-based redirect on success
- Error states: invalid credentials, unconfirmed email, network failure

#### 5.2.2 Doctor / Patient Signup

**Fields:**
- Full Name
- Email
- Password
- Role selection (Doctor / Patient)

**Validation:**
- Email format
- Minimum 8-character password
- Duplicate email prevention (Supabase constraint)

#### 5.2.3 Receptionist Signup

**Additional Fields:**
- Clinic Code (6-char code from doctor)
- System validates code against the `profiles` table before allowing account creation
- On success, `employer_id` is automatically set to the matched doctor's user ID
- Shows clear error if the code is invalid or already used

---

### 5.3 Module: Dashboard Home

**Route:** `/dashboard/home`  
**Roles:** Doctor, Patient

#### 5.3.1 Doctor Dashboard

| Widget | Description |
|---|---|
| **Quick Actions** | One-click shortcuts: "Add Patient", "New Appointment", "Create Prescription" |
| **Total Patients** | Count of all patients linked to this doctor; links to Patients Manager |
| **Total Appointments** | All scheduled appointments; links to Appointments Manager |
| **Total Earnings** | Placeholder metric (configurable in future) |
| **Patient Engagement Chart** | Sparkline/trend chart of patient visits over time |
| **Today's Appointments** | List of today's scheduled appointments, with status badges (scheduled / completed / cancelled) |
| **Live Queue Panel** | Real-time list of today's walk-in patients; see below |

**Live Queue Panel (Doctor-only)**
- Displays patients added by the receptionist for today
- Powered by **Supabase Realtime** (`postgres_changes` on `patients` table)
- Shows queue position number, patient name, ID, age, sex, BP, HR, and arrival time
- "Next Up" highlight for position #1 with a prominent "Mark Seen ✓" button
- Doctor can toggle any patient from `waiting` → `seen` (and back with "Undo")
- Seen patients move to a collapsed "✓ Seen Today (N)" section
- Zero-effort: UI updates automatically when receptionist adds a new walk-in

#### 5.3.2 Patient Dashboard

| Widget | Description |
|---|---|
| **Quick Actions** | "Book Appointment", "View Prescriptions" |
| **Total Prescriptions** | Count of prescriptions received; links to Prescriptions page |
| **Total Appointments** | Count of all appointments booked |
| **Upcoming Visits** | Count of today's appointments |
| **Today's Appointments** | Today's schedule with doctor name and appointment time |

---

### 5.4 Module: Appointments Manager

**Route:** `/dashboard/appointments`  
**Roles:** Doctor, Patient

#### 5.4.1 Calendar Views

Three interchangeable view modes accessible via a toggle:

| View | Doctor | Patient |
|---|---|---|
| **Month View** | Shows appointment count badge per day; click day to see details | Same |
| **Week View** | Time-slotted grid (09:00–20:30, 30min slots); appointments shown in colored blocks | Same |
| **List View** | Card grid of all appointments with date, time, name, and status badge | Same |

**Month View Details:**
- Full calendar grid (Sun–Sat)
- Current day highlighted in cyan
- Days outside the current month are dimmed
- Clicking any day opens a **Day Details Modal** showing all appointments for that day
- Appointment count shown as a circular badge per cell

**Week View Details:**
- 7-column grid (or 3-column on mobile)
- Each time row is clickable → opens Booking Modal pre-filled with selected date/time
- Existing appointments rendered as colored blocks (cyan = scheduled, green = confirmed)
- Responsive: mobile shows 3 days, desktop shows full 7 days

**Navigation:** Chevron buttons to go forward/backward; "Today" jump link.

#### 5.4.2 Booking an Appointment

**Doctor Flow:**
1. Clicks "New Appointment" or clicks a calendar slot
2. Modal opens: select patient from dropdown (doctor's patient list), pick date, pick time slot
3. Confirms → appointment created in `appointments` table with `doctor_id` + `patient_id`

**Patient Flow:**
1. Clicks "Book Consultation" or calendar slot
2. Modal opens: select doctor from dropdown (all doctors in system), pick date, pick time slot
3. Confirms → appointment created

**Time Slots:** Fixed 30-minute slots from 09:00 to 20:30

**Google Calendar Integration (Doctor only):**
- If `google_calendar_sync_enabled = true` in profile, the system calls `createCalendarEvent()` after booking
- If sync fails, doctor is prompted to manually add via Google Calendar deep link
- Every appointment card in List View also shows a "Add to Google Calendar" icon button

#### 5.4.3 Day Details Modal

Opened by clicking any calendar day:
- Header shows day name and full date
- Lists all appointments for that day with time, doctor/patient name, and status badge
- "+ (Add)" button in header to quickly book for that day
- Empty state with "Book Appointment" CTA if no appointments

#### 5.4.4 Appointment Status

| Status | Badge Color |
|---|---|
| `scheduled` | Amber |
| `confirmed` | Emerald |
| `cancelled` | Rose |
| `completed` | Emerald |

---

### 5.5 Module: Patients Manager

**Route:** `/dashboard/patients`  
**Roles:** Doctor only

This is the core clinical record system.

#### 5.5.1 Patient List

**Displayed columns:**
- Patient avatar (first-letter initials)
- Full Name + Email
- Patient ID (auto-generated, truncated with monospace font)
- Age / Sex
- Vitals (Blood Pressure, Heart Rate — if recorded)
- Status badge ("Active", "Prescribed Today")
- Actions (hover-revealed): Prescribe, Edit, Delete

**Filters (Time-based):**

| Filter | Scope |
|---|---|
| Today | Patients added today |
| Last Week | Patients added in the past 7 days |
| Last Month | Patients added in the past 30 days |
| All Time | Every patient linked to this doctor |

**Search:**
- Debounced real-time search (300ms) on patient name and patient ID
- Combined with active time filter

**"Prescribed Today" Badge:**
- System fetches prescriptions created today for all visible patients
- If a patient has a prescription created today, they receive this secondary badge
- Helps doctors quickly verify who has been handled

#### 5.5.2 Add / Edit Patient

Modal with two sections:

**Personal Info:**
- Full Name (required)
- Email (optional)
- Phone (optional)
- Age (required)
- Gender (Male / Female / Other)

**Vitals:**
- Blood Pressure (text, e.g. "120/80")
- Heart Rate (numeric, bpm)

On submit: creates/updates in `patients` table with `doctor_id = user.id`

#### 5.5.3 Delete Patient

Confirmation prompt → hard delete from `patients` table (cascades as per RLS)

#### 5.5.4 Patient Details Drawer

Clicking a patient row opens a full-screen side panel (`PatientDetails` component) showing:
- Complete medical history / timeline
- All past prescriptions for this patient
- Past appointments
- Current vitals snapshot
- "Create Prescription" quick action within the drawer

#### 5.5.5 Quick Prescription Shortcut

Hovering a patient row reveals a "Prescribe" button that opens `PrescriptionCreator` modal pre-filled with that patient's information.

---

### 5.6 Module: Prescriptions

**Route:** `/dashboard/prescriptions`  
**Roles:** Doctor (manage), Patient (view own)

#### 5.6.1 Doctor: Prescription Management

- Grid of cards, each showing: patient name, date, RX badge, prescription text preview (4 lines, clipped)
- **Actions per card:**
  - **View** — opens `PrescriptionPreviewModal` with the full formatted prescription
  - **Download** — opens modal with auto-triggered PDF download
  - **Edit** — opens `PrescriptionCreator` pre-filled for editing
  - **Delete** — confirmation prompt, then hard delete

#### 5.6.2 Patient: View Own Prescriptions

- Same card grid layout
- Shows doctor name and prescription date
- **Actions:** View, Download PDF
- Edit/Delete buttons are hidden for patients
- Patient is matched to prescriptions via their `email` address against the `patients` table

#### 5.6.3 Prescription Creator (`PrescriptionCreator` Modal)

Opened from Patients Manager or Prescriptions page (doctors only).

**Prescription Form Fields:**
- Medicine 1–N (name, dosage, frequency, duration) — dynamically add/remove medication rows
- General instructions / notes field
- Pre-filled with doctor's clinic information (see Settings)

**Preview before save:** Inline preview of the formatted prescription layout

**On Save:** Inserts into `prescriptions` table with `doctor_id`, `patient_id`, and `prescription_text`

#### 5.6.4 Prescription Preview Modal (`PrescriptionPreviewModal`)

Renders a printable prescription document styled with clinic branding:
- Clinic logo (if configured)
- Doctor name, qualification, clinic name, address, timings
- Patient name, ID, date
- Drug list in tabular format
- Doctor signature placeholder
- Footer text
- **PDF Download** via `jspdf` + `html2canvas`
- **Print** button via `react-to-print`

---

### 5.7 Module: Reception Desk

**Route:** `/dashboard/reception`  
**Roles:** Receptionist only

This module turns the front desk into a digital command center.

#### 5.7.1 Layout

Two-panel layout (1/3 form + 2/3 queue):

**Left Panel — Add Patient to Queue:**

| Field | Required |
|---|---|
| Patient Name | Yes |
| Age | No |
| Gender | No |
| Phone | No |
| Email | No |
| Blood Pressure | No |
| Heart Rate | No |

On submit:
- Generates a random `patient_id` (`P-XXXXXX` format)
- Inserts into `patients` table with `doctor_id = profile.employer_id`
- Toast notification confirms success ("✓ [Name] added to the queue!")
- Queue updates automatically via Realtime (no explicit refresh needed)

**Right Panel — Waitlist Today:**
- Shows all patients added today (most recent first)
- Each card: avatar, name, patient ID, age, sex, vitals (BP/HR), arrival time
- Live count badge: "N Waiting"
- Animated list entries (Framer Motion `layout` animation)
- Manual "Refresh" button in header as fallback

**Realtime Integration:**
- Supabase Realtime channel: `reception:patients:{employer_id}`
- INSERT → new card appears at top of queue
- UPDATE → card details refresh in-place
- DELETE → card slides out
- `CHANNEL_ERROR` fallback: displays console warning, manual refresh available

**Unlinked Account Guard:**
- If `profile.employer_id` is null (invalid clinic code during signup), receptionist sees an error screen explaining the issue and requesting the doctor share a valid code

#### 5.7.2 Cross-Module Sync with Doctor Dashboard

When the receptionist adds a patient:
1. Patient is created in `patients` table with `doctor_id`
2. Doctor's **Live Queue Panel** on the dashboard receives the INSERT event via a separate Realtime channel (`doctor:queue:{doctorId}`)
3. Doctor sees the patient appear instantly without any refresh

---

### 5.8 Module: AI Chatbot

**Route:** `/dashboard/chatbot`  
**Roles:** All

An accessible, conversational assistant embedded inside the dashboard.

#### 5.8.1 Capabilities

| Query Type | Behavior |
|---|---|
| "book an appointment" | Detects intent → provides link to Appointments page with a clickable "Go to Appointments →" CTA |
| "doctor availability" | Queries `profiles` table for doctors → lists available doctor names |
| General healthcare/app questions | Routes to **Gemini Pro API** for AI-generated response |
| Fallback (no API key) | Returns canned helpful responses about app navigation |

#### 5.8.2 Gemini AI Integration

- Uses `VITE_GEMINI_API_KEY` environment variable
- API: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- System prompt instructs the model to act as "MedVita Bot", stay concise, add medical disclaimer when needed
- Error fallback: If API call fails, bot responds with a helpful navigation shortcut message

#### 5.8.3 UX

- Chat bubble UI (user right-aligned, bot left-aligned)
- Bot avatar (Bot icon) vs User avatar (User icon)
- Typing indicator (animated 3-dot bounce) while response is loading
- Auto-scrolls to latest message
- Full-height panel, glassmorphism styling

---

### 5.9 Module: Availability Manager

**Route:** `/dashboard/availability`  
**Roles:** Doctor only

Allows doctors to configure their weekly working hours / slots:
- Set available days of the week
- Set working hours per day (start time / end time)
- Data used for slot availability checks when booking appointments

---

### 5.10 Module: Settings

**Accessible via:** Header bell / settings icon  
**Roles:** All (doctor has extended options)

#### 5.10.1 All Users

| Setting | Description |
|---|---|
| **Appearance** | Toggle between Light and Dark mode |
| **Interface Density** | Compact / Comfortable / Spacious layout density |
| **Push Notifications** | Enable/disable appointment alert notifications (localStorage) |

#### 5.10.2 Doctor-Only Settings

| Setting | Description |
|---|---|
| **Clinic Code** | Generate or view the 6-character code shared with receptionists; copy to clipboard |
| **Google Calendar Sync** | Toggle On/Off; triggers Google OAuth sign-in; persists to `profiles.google_calendar_sync_enabled` |
| **Customize Prescription** | Sub-page within Settings modal |

**Prescription Customization Fields:**
- Clinic Logo (upload file → Base64 stored, or paste URL)
- Clinic Name
- Doctor Qualification (e.g., MBBS, MD)
- Clinic Timings (e.g., Mon–Sat: 9AM–5PM)
- Clinic Address
- Footer Text (e.g., "Thank you for your visit")
- All fields saved to `profiles` table and auto-applied to every prescription generated

---

## 6. Data Model (Key Tables)

### `profiles`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Matches `auth.users.id` |
| `full_name` | text | User display name |
| `role` | text | `doctor` / `patient` / `receptionist` |
| `employer_id` | UUID | For receptionists: links to doctor's user ID |
| `clinic_code` | text (unique) | 6-char code for receptionist linking |
| `clinic_name` | text | Doctor's clinic name |
| `doctor_qualification` | text | Degrees / specialization |
| `clinic_address` | text | Physical address |
| `clinic_timings` | text | Working hours text |
| `doctor_footer_text` | text | Prescription footer note |
| `clinic_logo_url` | text | Base64 image or URL |
| `google_calendar_sync_enabled` | boolean | Google Calendar integration flag |

### `patients`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Internal record ID |
| `patient_id` | text | Auto-generated "P-XXXXXX" display ID |
| `name` | text | Full name |
| `age` | integer | Age in years |
| `sex` | text | Male / Female / Other |
| `email` | text | Optional; used to link to patient auth account |
| `phone` | text | Optional contact |
| `blood_pressure` | text | e.g., "120/80" |
| `heart_rate` | integer | bpm |
| `doctor_id` | UUID | FK → `profiles.id` (owning doctor) |
| `queue_status` | text | `waiting` / `seen` (for Live Queue) |
| `created_at` | timestamptz | Used for queue ordering and date filters |

### `appointments`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `doctor_id` | UUID | FK → `profiles.id` |
| `patient_id` | UUID | FK → `patients.id` or `profiles.id` |
| `patient_name` | text | Denormalized for display |
| `date` | date | Appointment date |
| `time` | time | Appointment time |
| `status` | text | `scheduled` / `confirmed` / `cancelled` / `completed` |

### `prescriptions`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `doctor_id` | UUID | FK → `profiles.id` |
| `patient_id` | UUID | FK → `patients.id` |
| `prescription_text` | text | Full prescription body (may be structured JSON or text) |
| `created_at` | timestamptz | Issue date |

---

## 7. Technical Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19 + Vite 7 |
| **Routing** | React Router DOM v7 |
| **Styling** | Tailwind CSS v4 + custom glassmorphism design system |
| **Animation** | Framer Motion (list animations, modals, toasts) |
| **Icons** | Lucide React |
| **UI Primitives** | Headless UI (Dialog, Transition, RadioGroup, Switch) |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **AI** | Google Gemini Pro API |
| **Calendar Integration** | Google Calendar API (gapi) |
| **PDF Generation** | jsPDF + html2canvas |
| **Printing** | react-to-print |
| **Date Utilities** | date-fns |
| **Charts** | Recharts (Patient Engagement Chart) |
| **Testing** | Vitest + React Testing Library |
| **Linting** | ESLint 9 |
| **Deployment** | Vercel |

---

## 8. Design System & UX Principles

### 8.1 Color Palette

| Token | Usage |
|---|---|
| **Cyan / Blue gradient** | Primary actions, CTAs, avatars, branded elements |
| **Emerald / Teal** | Success states, "seen" queue status, active badges |
| **Amber** | Waiting states, warning indicators |
| **Rose / Red** | Danger actions, error states, cancelled status |
| **Slate** | Text hierarchy, backgrounds, borders |

### 8.2 Design Patterns

- **Glassmorphism:** All card panels use `glass-panel` class (backdrop-blur, transparent backgrounds, subtle borders)
- **Gradient CTAs:** Primary buttons use `from-cyan-500 to-blue-500` gradient with shadow glow
- **Micro-animations:** Hover scale effects (`hover:scale-[1.02]`), animated ping dots for live indicators, Framer Motion slide-in for queue items
- **Dark Mode:** Fully supported across all components; toggled via `ThemeContext`; persisted in localStorage
- **Responsive:** Mobile-first layout; table views collapse to card views on small screens; week calendar shows 3 days on mobile vs 7 on desktop

### 8.3 Accessibility

- Semantic HTML throughout
- WCAG AA+ color contrast ratios
- All modals use Headless UI's `Dialog` with proper ARIA management
- Screen reader support via `sr-only` labels on icon-only buttons

---

## 9. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Performance** | Initial load < 2s (Vite code splitting); dashboard data < 500ms |
| **Realtime Latency** | Queue updates should propagate in < 300ms via Supabase Realtime |
| **Uptime** | Supabase-backed; 99.9% target (Supabase SLA) |
| **Security** | RLS enforced at DB level; no client-side role spoofing possible |
| **Privacy** | Patient data isolated per doctor via `doctor_id` FK and RLS |
| **Scalability** | Supabase auto-scales DB; Vercel handles frontend via CDN edge |
| **Offline Behavior** | Graceful degradation; errors surfaced to user; no silent failures |

---

## 10. User Flows

### 10.1 Doctor: Complete Daily Workflow

```
Login → Dashboard
  ↓
Review Live Queue (walk-ins from reception)
  ↓
Click patient → Mark Seen
  ↓
Go to Patients Manager → Click patient → View details
  ↓
Create Prescription → Preview → Save
  ↓
Go to Appointments → View today's scheduled patients
  ↓
End of day: Review analytics on Dashboard
```

### 10.2 Patient: Book & Receive Prescription

```
Signup → Dashboard
  ↓
Book Appointment (select doctor, date, time)
  ↓
Attend clinic → Doctor creates prescription
  ↓
Patient dashboard → Prescriptions → View / Download PDF
```

### 10.3 Receptionist: Walk-In Registration

```
Login → Reception Dashboard (auto-redirected)
  ↓
Fill patient info (name, vitals) → Submit
  ↓
Queue panel updates with new patient card
  ↓
Doctor's dashboard Live Queue updates in real-time
  ↓
Doctor marks patient as "Seen"
```

---

## 11. Integrations

### 11.1 Google Calendar

- **Doctor-only** feature enabled in Settings
- OAuth flow via `gapi` (Google APIs JavaScript client)
- When a new appointment is created: `createCalendarEvent()` fires to add event to doctor's Google Calendar
- Manual "Add to Calendar" deep link available on every appointment card as fallback
- Sync indicator icon (calendar icon filled) shown on synced appointments

### 11.2 Google Gemini Pro API

- Powers the in-app AI Chatbot
- Dynamic medical assistance, app navigation help
- API key stored in `.env` as `VITE_GEMINI_API_KEY`
- Gracefully falls back to canned responses if key is missing or API fails

### 11.3 Supabase Realtime

- Two separate Realtime channels:
  - `doctor:queue:{doctorId}` — consumed by Doctor Dashboard's Live Queue Panel
  - `reception:patients:{employerId}` — consumed by Receptionist Dashboard
- Both listen to `postgres_changes` on the `patients` table
- Filtered by `doctor_id` to prevent cross-clinic data leakage

---

## 12. Security Considerations

| Concern | Mitigation |
|---|---|
| **Cross-clinic data access** | RLS policies enforce `doctor_id = auth.uid()` on all patient reads/writes |
| **Receptionist spoofing** | Clinic Code required at signup; `employer_id` validated server-side before data write |
| **Prescription access** | Patients fetch prescriptions only via their linked email; doctors fetch only with `doctor_id = auth.uid()` |
| **API key exposure** | Gemini and Google API keys are Vite environment variables not committed to version control |
| **Auth tokens** | Managed by Supabase; JWTs verified server-side on every request |

---

## 13. Environment Configuration

| Variable | Required By | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase public anon key |
| `VITE_GEMINI_API_KEY` | Frontend | Google Gemini API key for chatbot |

---

## 14. Known Limitations (v1.0)

| Area | Limitation |
|---|---|
| **Earnings metric** | Hardcoded placeholder ($6,220); not calculated from real billing data |
| **Patient-Doctor linking** | Patients are matched to prescriptions via email, not a formal FK; if patient email doesn't match, prescriptions won't appear |
| **Google Calendar** | OAuth flow relies on `gapi` which requires the browser to support third-party scripts; may be blocked by strict CSPs |
| **Prescription text format** | Currently stored as raw text; no enforced structured JSON schema for medication entries |
| **Availability Manager** | UI built but real-time slot blocking in appointment booking is not yet enforced |
| **No pagination** | Patient and appointment lists load all records; large datasets may have performance impact |

---

## 15. Future Roadmap

| Priority | Feature |
|---|---|
| 🔴 High | Prescription medication structured format (drug name, dosage, frequency, duration as separate fields) |
| 🔴 High | Patient–Doctor linking via explicit invitation (not just email match) |
| 🔴 High | Appointment slot blocking (prevent double-booking) |
| 🟡 Medium | Billing and invoicing module |
| 🟡 Medium | Patient medication reminders via email |
| 🟡 Medium | Multi-doctor clinic support (practice group) |
| 🟡 Medium | Offline mode with local-first data sync |
| 🟢 Low | Native mobile app (React Native) |
| 🟢 Low | Lab orders and results attachment |
| 🟢 Low | Telemedicine (video consultation) |

---

*End of MedVita Product Specification Document v1.0*
