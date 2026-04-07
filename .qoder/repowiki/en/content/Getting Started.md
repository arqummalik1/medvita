# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://frontend/package.json)
- [.env.example](file://frontend/.env.example)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js)
- [vite.config.js](file://frontend/vite.config.js)
- [main.jsx](file://frontend/src/main.jsx)
- [App.jsx](file://frontend/src/App.jsx)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx)
- [ThemeContext.jsx](file://frontend/src/context/ThemeContext.jsx)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx)
- [Login.jsx](file://frontend/src/pages/Login.jsx)
- [Signup.jsx](file://frontend/src/pages/Signup.jsx)
- [schema.sql](file://backend/schema.sql)
- [config.toml](file://supabase/config.toml)
- [GOOGLE_CALENDAR_SETUP.md](file://frontend/GOOGLE_CALENDAR_SETUP.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Environment Variables](#environment-variables)
5. [Project Structure](#project-structure)
6. [Initial Setup Verification](#initial-setup-verification)
7. [Development Workflows](#development-workflows)
8. [Deployment Targets](#deployment-targets)
9. [Troubleshooting](#troubleshooting)
10. [Conclusion](#conclusion)

## Introduction
MedVita is a modern healthcare management platform featuring role-based access for doctors and patients, with capabilities for managing appointments, prescriptions, and medical histories. It is built with React, Vite, Tailwind CSS, and Supabase (PostgreSQL), and includes a responsive UI with dark mode support and accessibility features.

## Prerequisites
Before installing MedVita, ensure you have the following:
- Node.js (LTS recommended) installed on your machine
- Git for version control
- A Supabase account and project set up
- Basic familiarity with command-line tools and package managers

These prerequisites are required to clone the repository, install dependencies, and run the development server.

**Section sources**
- [README.md](file://README.md#L50-L76)

## Installation
Follow these step-by-step instructions to install and run MedVita locally:

1. Clone the repository
   - Use Git to clone the repository to your local machine.
   - Navigate into the project directory.

2. Install frontend dependencies
   - Enter the frontend directory and install dependencies using your preferred package manager.

3. Configure environment variables
   - Create a local environment file with your Supabase credentials and optional Google Calendar configuration.

4. Run the development server
   - Start the Vite development server. The app will be available at the default port.

These steps align with the official setup instructions in the project’s documentation.

**Section sources**
- [README.md](file://README.md#L50-L76)

## Environment Variables
Environment variables are essential for connecting the frontend to Supabase and enabling optional integrations like Google Calendar.

- Supabase credentials
  - VITE_SUPABASE_URL: Your Supabase project URL
  - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key

- Google Calendar integration (optional)
  - VITE_GOOGLE_CLIENT_ID: OAuth client ID from Google Cloud Console
  - VITE_GOOGLE_API_KEY: API key from Google Cloud Console

Notes:
- The frontend reads these variables at build/runtime via Vite’s import.meta.env mechanism.
- The Supabase client checks for the presence of URL and anon key and logs a warning if missing.
- For Google Calendar, ensure OAuth consent screen and authorized origins/redirects match your development and production URLs.

**Section sources**
- [.env.example](file://frontend/.env.example#L1-L9)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L1-L11)
- [GOOGLE_CALENDAR_SETUP.md](file://frontend/GOOGLE_CALENDAR_SETUP.md#L44-L62)

## Project Structure
MedVita is organized into three main areas:
- frontend: React application with Vite, Tailwind CSS, routing, and Supabase integration
- backend: Database schema and policies for Supabase
- supabase: Local Supabase configuration and Edge Functions

High-level layout:
- frontend
  - src: React components, pages, contexts, and libraries
  - public: Static assets
  - vite.config.js: Build and plugin configuration
  - package.json: Scripts and dependencies
- backend
  - schema.sql: Database schema and Row Level Security (RLS) policies
- supabase
  - config.toml: Local Supabase project configuration
  - functions: Edge Functions (e.g., email handler)

Key runtime entry points:
- frontend/src/main.jsx: Initializes React root, router, and theme provider
- frontend/src/App.jsx: Defines routes and protected routes
- frontend/src/context/AuthContext.jsx: Handles authentication state and profile retrieval
- frontend/src/lib/supabaseClient.js: Creates the Supabase client instance

**Section sources**
- [README.md](file://README.md#L16-L28)
- [main.jsx](file://frontend/src/main.jsx#L1-L17)
- [App.jsx](file://frontend/src/App.jsx#L1-L62)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L1-L108)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L1-L11)
- [schema.sql](file://backend/schema.sql#L1-L274)
- [config.toml](file://supabase/config.toml#L1-L385)

## Initial Setup Verification
To verify your setup is correct:

1. Confirm environment variables
   - Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present in your environment file.
   - Optionally verify Google Calendar variables if integrating.

2. Start the development server
   - Run the dev script from the frontend directory.
   - Visit the development URL in your browser.

3. Test authentication
   - Navigate to the login page and attempt to sign in.
   - Observe the authentication flow and redirection behavior.

4. Check Supabase connectivity
   - Inspect the browser console for warnings related to missing Supabase credentials.
   - Confirm that the Supabase client initializes without errors.

5. Verify routing and roles
   - After logging in, ensure the correct dashboard loads based on your role.
   - Attempt to access protected routes to confirm role-based access control.

**Section sources**
- [README.md](file://README.md#L50-L76)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L6-L8)
- [Login.jsx](file://frontend/src/pages/Login.jsx#L20-L75)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)

## Development Workflows
Common development tasks and workflows:

- Running the app locally
  - Use the dev script to start the Vite development server.
  - The server will rebuild on file changes.

- Building for production
  - Use the build script to generate optimized static assets.
  - The output is placed in the dist directory as configured.

- Testing
  - Run unit tests using the test script.
  - Vitest is configured with JSDOM and a setup file.

- Linting
  - Use the lint script to run ESLint across the project.

- Hot module replacement and plugins
  - Vite is configured with React and Tailwind CSS plugins.
  - Chunk splitting is configured for vendor libraries.

- Authentication and routing
  - Auth state is managed centrally and persisted across sessions.
  - Protected routes enforce role-based access and redirect unauthenticated users.

**Section sources**
- [package.json](file://frontend/package.json#L6-L12)
- [vite.config.js](file://frontend/vite.config.js#L1-L33)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L41)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)

## Deployment Targets
Deploy MedVita to various platforms using the provided configurations:

- Vercel
  - A Vercel configuration file exists in the frontend directory.
  - Configure environment variables in Vercel with your Supabase and Google Calendar keys.

- Static hosting
  - Build the project and serve the dist folder from any static host.
  - Ensure environment variables are injected at build time or via runtime configuration.

- Supabase Edge Functions
  - The supabase/functions directory contains Edge Functions.
  - Deploy functions using the Supabase CLI or dashboard.

- Supabase project
  - Apply the backend schema and policies to your Supabase project.
  - Configure database settings and RLS policies as defined in the schema.

**Section sources**
- [README.md](file://README.md#L77-L80)
- [vercel.json](file://frontend/vercel.json)
- [schema.sql](file://backend/schema.sql#L1-L274)
- [config.toml](file://supabase/config.toml#L1-L385)

## Troubleshooting
Common setup and runtime issues:

- Missing Supabase credentials
  - Symptom: Warning in the console about missing URL or anon key.
  - Resolution: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment file.

- Authentication failures
  - Symptom: Login errors or inability to redirect after sign-in.
  - Resolution: Verify credentials, confirm profile creation triggers, and check auth state subscriptions.

- Protected route access denied
  - Symptom: Unauthorized page when accessing a route.
  - Resolution: Ensure your profile role matches the allowed roles for the route.

- Google Calendar integration issues
  - Symptom: Failure to connect or events not syncing.
  - Resolution: Confirm OAuth consent screen configuration, authorized origins/redirects, and API key restrictions.

- Build-time errors
  - Symptom: Build failures or missing environment variables.
  - Resolution: Ensure all required environment variables are present and correctly formatted.

- Database schema and policies
  - Symptom: Permission errors or missing tables.
  - Resolution: Apply the backend schema and policies to your Supabase project.

**Section sources**
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L6-L8)
- [Login.jsx](file://frontend/src/pages/Login.jsx#L59-L75)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L82-L93)
- [GOOGLE_CALENDAR_SETUP.md](file://frontend/GOOGLE_CALENDAR_SETUP.md#L83-L103)
- [schema.sql](file://backend/schema.sql#L1-L274)

## Conclusion
You are now ready to develop and deploy MedVita. Ensure environment variables are configured, verify authentication and routing, and apply the backend schema to your Supabase project. Use the provided scripts and configurations for local development and deployment to your target platform.