# MedVita - Repository Wiki

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Features](#features)
8. [API & Services](#api--services)
9. [Environment Configuration](#environment-configuration)
10. [Development Guide](#development-guide)

---

## Project Overview

**MedVita** is a comprehensive healthcare management platform designed for modern medical practices. It provides role-based access control for doctors, patients, and receptionists, enabling efficient management of appointments, prescriptions, and medical records through a modern, responsive web interface.

### Key Capabilities
- Multi-role user system (Doctor, Patient, Receptionist)
- Appointment scheduling and management
- Digital prescription creation and delivery
- Patient medical history tracking
- Real-time availability management
- Analytics dashboard with health metrics
- Email notifications for prescriptions

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Doctor    │  │   Patient   │  │    Receptionist     │ │
│  │   Portal    │  │   Portal    │  │      Portal         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Frontend (React + Vite)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  React 19   │  │  React      │  │  Tailwind CSS v4    │ │
│  │  Components │  │  Router v7  │  │  + Framer Motion    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Backend & Database (Supabase)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  PostgreSQL │  │   Auth      │  │  Edge Functions     │ │
│  │  Database   │  │  (RLS)      │  │  (Deno)             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → React Component → Supabase Client → PostgreSQL
                                              ↓
                    Response ← Edge Function ← Storage (Files)
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.0 | UI Library |
| Vite | ^7.2.4 | Build Tool |
| React Router DOM | ^7.12.0 | Client-side Routing |
| Tailwind CSS | ^4.1.18 | Utility-first CSS |
| Framer Motion | ^12.27.5 | Animations |
| Headless UI | ^2.2.9 | Accessible UI Components |
| Lucide React | ^0.562.0 | Icons |
| Recharts | ^3.7.0 | Data Visualization |
| date-fns | ^4.1.0 | Date Manipulation |
| jspdf | ^4.0.0 | PDF Generation |
| html2canvas | ^1.4.1 | HTML to Canvas |
| react-to-print | ^3.2.0 | Print Functionality |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service |
| PostgreSQL | Primary Database |
| Row Level Security (RLS) | Data Access Control |
| Supabase Auth | Authentication |
| Edge Functions (Deno) | Serverless Functions |

### Development Tools
| Tool | Purpose |
|------|---------|
| ESLint | Code Linting |
| Vitest | Unit Testing |
| @testing-library/react | Component Testing |

---

## Project Structure

```
MedVita/
├── frontend/                    # React Application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── assets/              # Images, fonts
│   │   ├── components/          # Reusable components
│   │   │   ├── ui/              # UI primitives (Button, Card, Input, Badge)
│   │   │   ├── Header.jsx       # Top navigation bar
│   │   │   ├── Layout.jsx       # Page layout wrapper
│   │   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   │   ├── ProtectedRoute.jsx  # Auth route guard
│   │   │   ├── PatientDetails.jsx  # Patient info display
│   │   │   ├── PrescriptionCreator.jsx  # Prescription form
│   │   │   ├── PrescriptionPreviewModal.jsx  # PDF preview
│   │   │   ├── SettingsModal.jsx  # User settings
│   │   │   ├── ThemeToggle.jsx  # Dark/Light mode
│   │   │   ├── StatCard.jsx     # Dashboard stat cards
│   │   │   ├── SparklineChart.jsx  # Mini charts
│   │   │   └── PatientEngagementChart.jsx  # Analytics charts
│   │   ├── context/             # React Context providers
│   │   │   ├── AuthContext.jsx  # Authentication state
│   │   │   └── ThemeContext.jsx # Theme state
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility libraries
│   │   │   ├── supabaseClient.js  # Supabase client config
│   │   │   └── googleCalendar.js  # Calendar integration
│   │   ├── pages/               # Page components
│   │   │   ├── Landing.jsx      # Marketing landing page
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Signup.jsx       # Registration page
│   │   │   ├── ReceptionistSignup.jsx  # Staff registration
│   │   │   ├── DashboardHome.jsx  # Main dashboard
│   │   │   ├── PatientsManager.jsx  # Patient CRUD
│   │   │   ├── AppointmentsManager.jsx  # Appointment management
│   │   │   ├── AvailabilityManager.jsx  # Doctor availability
│   │   │   ├── PrescriptionsViewer.jsx  # Prescription history
│   │   │   ├── EarningsManager.jsx  # Revenue tracking
│   │   │   ├── ReceptionDashboard.jsx  # Receptionist portal
│   │   │   └── Chatbot.jsx      # AI assistant
│   │   ├── App.jsx              # Root component
│   │   ├── main.jsx             # Entry point
│   │   ├── App.css              # Component styles
│   │   └── index.css            # Global styles
│   ├── testsprite_tests/        # Test configuration
│   ├── package.json             # Dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── vitest.config.js         # Test configuration
│   └── eslint.config.js         # Linting rules
│
├── backend/                     # Database & Backend
│   └── schema.sql               # Complete database schema
│
├── supabase/                    # Supabase configuration
│   └── functions/               # Edge Functions
│       └── send-prescription-email/
│           └── index.ts         # Email notification function
│
└── README.md                    # Project documentation
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     auth.users  │     │     profiles     │     │ doctor_avail    │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │◄────┤ id (PK/FK)       │     │ id (PK)         │
│ email           │     │ email            │     │ doctor_id (FK)  │
│                 │     │ role             │     │ day_of_week     │
│                 │     │ full_name        │     │ start_time      │
│                 │     │ employer_id (FK) │     │ end_time        │
│                 │     │ clinic_code      │     └─────────────────┘
│                 │     │ google_calendar  │
│                 │     └──────────────────┘
│                 │              │
│                 │              │
│                 │     ┌────────▼─────────┐     ┌─────────────────┐
│                 │     │     patients     │     │  appointments   │
│                 │     ├──────────────────┤     ├─────────────────┤
│                 └────►│ id (PK)          │     │ id (PK)         │
│                       │ name             │     │ patient_id (FK) │
│                       │ age              │     │ doctor_id (FK)  │
│                       │ sex              │     │ date            │
│                       │ blood_pressure   │     │ time            │
│                       │ heart_rate       │     │ status          │
│                       │ email            │     └─────────────────┘
│                       │ patient_id       │
│                       │ doctor_id (FK)   │◄────┐
│                       │ user_id (FK)     │     │
│                       └──────────────────┘     │
│                                │               │
│                       ┌────────▼─────────┐     │
│                       │  prescriptions   │     │
│                       ├──────────────────┤     │
│                       │ id (PK)          │     │
│                       │ patient_id (FK)  │◄────┘
│                       │ doctor_id (FK)   │
│                       │ prescription_text│
│                       │ file_url         │
│                       └──────────────────┘
│
└──────────────────────────────────────────────────────────────────┐
                          Storage Bucket                           │
                          ┌─────────────────┐                      │
                          │ medvita-files   │                      │
                          │ (Public)        │                      │
                          └─────────────────┘                      │
                                                                   │
                          Edge Functions                           │
                          ┌─────────────────────────┐              │
                          │ send-prescription-email │              │
                          │ (Resend API)            │              │
                          └─────────────────────────┘              │
```

### Table Definitions

#### 1. profiles
Extends Supabase Auth with role-based information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | References auth.users, Primary Key |
| email | text | User email address |
| role | text | Enum: 'doctor', 'patient', 'receptionist' |
| full_name | text | Display name |
| employer_id | uuid | For receptionists - links to doctor |
| clinic_code | text | Unique code for doctor invites |
| google_calendar_sync_enabled | boolean | Calendar integration flag |
| created_at | timestamptz | Creation timestamp |

#### 2. patients
Stores patient medical records.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary Key |
| name | text | Patient name |
| age | integer | Patient age |
| sex | text | Biological sex |
| blood_pressure | text | BP reading (e.g., "120/80") |
| heart_rate | integer | Heart rate BPM |
| email | text | Contact email |
| patient_id | text | Unique patient identifier (P-XXXXXX) |
| doctor_id | uuid | Assigned doctor |
| user_id | uuid | Linked auth user (optional) |

#### 3. doctor_availability
Doctor working hours configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary Key |
| doctor_id | uuid | Doctor reference |
| day_of_week | text | Day name |
| start_time | time | Work start |
| end_time | time | Work end |

#### 4. appointments
Appointment bookings.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary Key |
| patient_id | uuid | Patient reference |
| patient_name | text | Cached name for display |
| doctor_id | uuid | Doctor reference |
| date | date | Appointment date |
| time | time | Appointment time |
| status | text | Enum: 'scheduled', 'completed', 'cancelled' |

#### 5. prescriptions
Digital prescriptions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary Key |
| patient_id | uuid | Patient reference |
| doctor_id | uuid | Doctor reference |
| prescription_text | text | Prescription content |
| file_url | text | PDF file URL |

---

## Authentication & Authorization

### Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────┐
│                        ROLES                                │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│   doctor    │   patient   │ receptionist│     anonymous     │
├─────────────┼─────────────┼─────────────┼───────────────────┤
│ Full access │ Own records │ Employer's  │ Landing, Login,   │
│ to their    │ only        │ patients    │ Signup only       │
│ patients    │             │             │                   │
├─────────────┼─────────────┼─────────────┼───────────────────┤
│ Manage      │ Book appts  │ Book appts  │                   │
│ availability│ View        │ for employer│                   │
│             │ prescriptions             │                   │
├─────────────┼─────────────┼─────────────┼───────────────────┤
│ Create      │             │             │                   │
│ prescriptions             │             │                   │
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

### Row Level Security (RLS) Policies

The database implements comprehensive RLS policies:

- **Profiles**: Users can view all profiles, but only update their own
- **Patients**: Doctors see their patients; receptionists see employer's patients; patients see their own record by email
- **Appointments**: Visible to doctor, patient, or patient's doctor
- **Prescriptions**: Doctors manage all; patients view their own
- **Availability**: Public read; doctor-only write

---

## Features

### Doctor Features

| Feature | Component | Description |
|---------|-----------|-------------|
| Dashboard | DashboardHome.jsx | Analytics, stats, upcoming appointments |
| Patient Management | PatientsManager.jsx | CRUD operations, medical history |
| Appointment Management | AppointmentsManager.jsx | View, update, cancel appointments |
| Availability Settings | AvailabilityManager.jsx | Configure working hours |
| Prescriptions | PrescriptionCreator.jsx | Create digital prescriptions with PDF |
| Earnings | EarningsManager.jsx | Revenue tracking and reports |

### Patient Features

| Feature | Component | Description |
|---------|-----------|-------------|
| Appointment Booking | AppointmentsManager.jsx | Calendar-based booking |
| Medical History | PrescriptionsViewer.jsx | View past prescriptions |
| Dashboard | DashboardHome.jsx | Health overview, upcoming visits |

### Receptionist Features

| Feature | Component | Description |
|---------|-----------|-------------|
| Patient Management | ReceptionDashboard.jsx | Manage employer's patients |
| Appointment Booking | ReceptionDashboard.jsx | Book for patients |
| Check-in/Check-out | ReceptionDashboard.jsx | Manage patient flow |

---

## API & Services

### Supabase Client

Located at: `frontend/src/lib/supabaseClient.js`

```javascript
// Environment Variables Required:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Edge Functions

#### send-prescription-email

**Location**: `supabase/functions/send-prescription-email/index.ts`

**Purpose**: Sends prescription PDFs to patients via email

**Provider**: Resend API

**Request Body**:
```json
{
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "pdfUrl": "https://.../prescription.pdf",
  "doctorName": "Dr. Smith",
  "clinicName": "MedVita Clinic"
}
```

**Features**:
- Fetches PDF from storage
- Converts to Base64 attachment
- Sends styled HTML email
- Includes health tips

---

## Environment Configuration

### Required Environment Variables

Create `.env.local` in the `frontend/` directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Google Calendar
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Edge Function Secrets

Set via Supabase Dashboard or CLI:

```bash
supabase secrets set RESEND_API_KEY=your-resend-api-key
```

---

## Development Guide

### Getting Started

```bash
# 1. Clone repository
git clone <repository-url>
cd MedVita

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |

### Database Setup

1. Create Supabase project
2. Run SQL from `backend/schema.sql` in SQL Editor
3. Enable Row Level Security
4. Configure Storage bucket `medvita-files`

### Testing

Tests are located in:
- `frontend/src/_trash/__tests__/` - Component tests
- `frontend/testsprite_tests/` - Test configuration

Run tests:
```bash
npm run test
```

---

## Component Reference

### UI Components (ui/)

| Component | Props | Description |
|-----------|-------|-------------|
| Button | variant, size, children | Action button with variants |
| Card | children, className | Container component |
| Input | type, placeholder, value, onChange | Form input |
| Badge | variant, children | Status indicator |

### Layout Components

| Component | Purpose |
|-----------|---------|
| Layout.jsx | Main page layout with sidebar |
| Header.jsx | Top navigation with user menu |
| Sidebar.jsx | Navigation menu |
| ProtectedRoute.jsx | Route guard for authentication |

### Feature Components

| Component | Purpose |
|-----------|---------|
| PatientDetails.jsx | Detailed patient information display |
| PrescriptionCreator.jsx | Form for creating prescriptions |
| PrescriptionPreviewModal.jsx | PDF preview and download |
| SettingsModal.jsx | User preferences and profile |
| ThemeToggle.jsx | Dark/light mode switch |
| StatCard.jsx | Dashboard statistics card |
| PatientEngagementChart.jsx | Analytics visualization |
| SparklineChart.jsx | Mini trend charts |

---

## Routing Structure

```
/                    → Landing (marketing page)
/login               → Login
/signup              → Patient/Doctor signup
/staff-signup        → Receptionist signup

/dashboard           → DashboardHome (role-based)
/dashboard/appointments    → AppointmentsManager
/dashboard/patients        → PatientsManager (doctors only)
/dashboard/availability    → AvailabilityManager (doctors only)
/dashboard/earnings        → EarningsManager (doctors only)
/dashboard/prescriptions   → PrescriptionsViewer
/dashboard/reception       → ReceptionDashboard (receptionists only)

/chatbot             → AI Assistant
```

---

## State Management

### AuthContext

Manages authentication state and user profile.

```javascript
const { user, profile, loading, signUp, signIn, signOut } = useAuth()
```

### ThemeContext

Manages dark/light mode preference.

```javascript
const { theme, toggleTheme } = useTheme()
```

---

## Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS enabled
2. **Role-based Policies**: Access controlled by user role
3. **Environment Variables**: Sensitive keys in `.env.local` (gitignored)
4. **CORS**: Edge functions configured with proper headers
5. **Input Validation**: Form validation on client and server

---

## Deployment

### Frontend (Vercel)

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Supabase

- Database: Managed by Supabase
- Edge Functions: Deploy via CLI
- Storage: Configure buckets in dashboard

---

## License

MIT License - See README.md for details.

---

*Last Updated: February 2026*
