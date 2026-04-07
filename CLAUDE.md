# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

All commands run from `frontend/`:

```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build to frontend/dist
npm run lint       # ESLint
npm run test       # Vitest (unit tests with jsdom)
npm run preview    # Preview production build
```

Edge function deployment:
```bash
supabase functions deploy send-prescription-email
```

## Architecture

**MedVita** is a healthcare management platform with a Supabase-first backend (no traditional API server).

### Stack
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Framer Motion
- **Backend**: Supabase (PostgreSQL with Row Level Security, Auth, Edge Functions, Storage)
- **Deployment**: Vercel (frontend SPA) + Supabase Cloud

### Key Architectural Decisions
- **No API layer**: Components query Supabase directly via `supabase.from('table').select(...)`. RLS policies handle authorization at the database level.
- **Client-side PDF generation**: html2canvas + jsPDF — no server rendering.
- **React Context only**: AuthContext + ThemeContext. No Redux/Zustand.
- **Realtime subscriptions**: Supabase channels for live updates (e.g., patient queue on DashboardHome).

### Data Flow
```
User Action → React Component → supabase client → PostgreSQL (RLS enforced)
                                       ↓
                              Edge Functions (email via Resend API)
                              Storage bucket (medvita-files)
```

### Three User Roles
| Role | Key Access |
|------|-----------|
| **doctor** | Full patient CRUD, prescriptions, availability, earnings |
| **patient** | Book appointments, view own prescriptions |
| **receptionist** | Manages employer doctor's patients via `employer_id` FK; self-registers with `clinic_code` |

### Frontend Structure (`frontend/src/`)
- `context/AuthContext.jsx` — auth state, `useAuth()` hook (user, profile with role, signUp/signIn/signOut)
- `context/ThemeContext.jsx` — dark/light theme, density, appStyle; persisted to localStorage
- `lib/supabaseClient.js` — single Supabase client instance used everywhere
- `components/ProtectedRoute.jsx` — route guard checking auth + `allowedRoles` prop
- `components/ui/` — reusable primitives (Button, Card, Input, Badge)
- `pages/` — full page views, each page queries Supabase directly

### Routing
Public: `/`, `/login`, `/signup`, `/staff-signup`
Protected under `/dashboard`: main dashboard, `/appointments`, `/patients` (doctor), `/availability` (doctor), `/earnings` (doctor), `/prescriptions`, `/reception` (receptionist)

### Database (6 tables in `backend/schema.sql`)
- `profiles` — extends auth.users with role, employer_id, clinic_code; auto-created by `handle_new_user()` trigger
- `patients` — medical records, linked to doctor via `doctor_id`
- `appointments` — status enum: scheduled/completed/cancelled
- `prescriptions` — text + PDF file_url in storage
- `doctor_availability` — weekly schedule (day_of_week + start/end time)
- Storage bucket `medvita-files` (public, 50MB limit)

### Edge Functions (`supabase/functions/`)
- `send-prescription-email` (Deno/TypeScript) — fetches PDF from storage, sends via Resend API with HTML email template

## Environment Variables

Frontend (`frontend/.env.local`):
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — required
- `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY` — optional (Google Calendar)
- `VITE_GEMINI_API_KEY` — optional (AI features)

Edge function secret: `RESEND_API_KEY` (set via Supabase dashboard)
