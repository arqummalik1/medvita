# Routing System & Navigation

<cite>
**Referenced Files in This Document**
- [App.jsx](file://frontend/src/App.jsx)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx)
- [main.jsx](file://frontend/src/main.jsx)
- [Layout.jsx](file://frontend/src/components/Layout.jsx)
- [Sidebar.jsx](file://frontend/src/components/Sidebar.jsx)
- [DashboardHome.jsx](file://frontend/src/pages/DashboardHome.jsx)
- [Login.jsx](file://frontend/src/pages/Login.jsx)
- [PatientsManager.jsx](file://frontend/src/pages/PatientsManager.jsx)
- [AppointmentsManager.jsx](file://frontend/src/pages/AppointmentsManager.jsx)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js)
- [package.json](file://frontend/package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains MedVita’s client-side routing system built with React Router v7. It covers route definitions, nested layouts, role-based access control via a ProtectedRoute wrapper, programmatic navigation, and integration with authentication flows. It also documents navigation patterns, route parameters handling, and best practices for maintainable routing and navigation state management.

## Project Structure
MedVita’s routing is configured at the application root and composed with shared layout and navigation components. The router is initialized in the application entry point and wraps the entire app with providers for authentication and theme.

```mermaid
graph TB
Browser["Browser"] --> Router["React Router v7<br/>BrowserRouter"]
Router --> App["App.jsx<br/>Route definitions"]
App --> AuthProvider["AuthProvider<br/>AuthContext.jsx"]
App --> Routes["Routes"]
Routes --> Public["Public routes<br/>/, /login, /signup, /staff-signup"]
Routes --> Dashboard["Protected dashboard routes<br/>/dashboard/*"]
Dashboard --> Layout["Layout.jsx<br/>Sidebar + Header"]
Layout --> Pages["Page components<br/>DashboardHome, AppointmentsManager,<br/>PatientsManager, PrescriptionsViewer,<br/>EarningsManager, AvailabilityManager,<br/>ReceptionDashboard, Chatbot"]
```

**Diagram sources**
- [main.jsx](file://frontend/src/main.jsx#L8-L16)
- [App.jsx](file://frontend/src/App.jsx#L26-L59)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L107)
- [Layout.jsx](file://frontend/src/components/Layout.jsx#L5-L42)

**Section sources**
- [main.jsx](file://frontend/src/main.jsx#L1-L17)
- [App.jsx](file://frontend/src/App.jsx#L1-L62)

## Core Components
- App.jsx: Declares all routes, including public pages and nested protected dashboard routes with a shared layout.
- ProtectedRoute: Enforces authentication and role-based access control, with dedicated unauthorized handling and default diversions.
- AuthProvider/AuthContext: Centralizes authentication state, profile retrieval, and auth state change subscriptions.
- Layout: Provides a shared dashboard shell with sidebar and header.
- Sidebar: Renders role-aware navigation links and highlights active routes.
- Page components: Implement route-specific logic and programmatic navigation.

**Section sources**
- [App.jsx](file://frontend/src/App.jsx#L26-L59)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L107)
- [Layout.jsx](file://frontend/src/components/Layout.jsx#L5-L42)
- [Sidebar.jsx](file://frontend/src/components/Sidebar.jsx#L19-L112)

## Architecture Overview
The routing architecture enforces authentication and role checks at the route level. ProtectedRoute ensures users are authenticated, have a profile, and belong to allowed roles. It also redirects users to role-appropriate dashboards and displays a tailored unauthorized page when access is denied.

```mermaid
sequenceDiagram
participant U as "User"
participant BR as "BrowserRouter"
participant R as "Routes/App.jsx"
participant PR as "ProtectedRoute.jsx"
participant AC as "AuthContext.jsx"
participant L as "Layout.jsx"
participant P as "Page Component"
U->>BR : Navigate to "/dashboard/patients"
BR->>R : Match route tree
R->>PR : Render ProtectedRoute wrapper
PR->>AC : useAuth()
AC-->>PR : {user, profile, loading}
alt loading
PR-->>U : Show loading screen
else unauthenticated
PR-->>U : Redirect to "/login?state"
else role mismatch
PR-->>U : Show UnauthorizedPage
else default diversion
PR-->>U : Redirect to role home (e.g., "/dashboard/reception")
else allowed
PR->>L : Render DashboardLayout
L->>P : Render target page
P-->>U : Rendered page
end
```

**Diagram sources**
- [App.jsx](file://frontend/src/App.jsx#L35-L53)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L107)
- [Layout.jsx](file://frontend/src/components/Layout.jsx#L5-L42)

## Detailed Component Analysis

### Route Definitions and Nested Layouts
- Root-level public routes: landing, login, signup, staff signup.
- Protected dashboard routes under /dashboard with nested children:
  - Index route renders the dashboard home.
  - Shared routes: appointments.
  - Doctor-only routes: patients, availability, earnings.
  - Patient-only routes: prescriptions.
  - Receptionist-only route: reception dashboard.
- Additional protected route: /chatbot guarded by ProtectedRoute and wrapped in Layout.

```mermaid
flowchart TD
A["App.jsx Routes"] --> B["Public: '/', '/login', '/signup', '/staff-signup'"]
A --> C["Protected: '/dashboard'"]
C --> D["DashboardLayout (Layout.jsx)"]
D --> E["Index: DashboardHome"]
D --> F["Shared: '/appointments'"]
D --> G["Doctor: '/patients', '/availability', '/earnings'"]
D --> H["Patient: '/prescriptions'"]
D --> I["Receptionist: '/reception'"]
A --> J["'/chatbot' -> ProtectedRoute(Layout(Chatbot))"]
```

**Diagram sources**
- [App.jsx](file://frontend/src/App.jsx#L26-L59)
- [Layout.jsx](file://frontend/src/components/Layout.jsx#L5-L42)

**Section sources**
- [App.jsx](file://frontend/src/App.jsx#L26-L59)

### ProtectedRoute Implementation
ProtectedRoute orchestrates:
- Authentication gating: redirects unauthenticated users to login with state preservation.
- Profile loading: waits for profile resolution before deciding access.
- Role-based access: compares profile.role against allowedRoles.
- Unauthorized handling: renders a themed unauthorized page with a link to the user’s home route.
- Default diversions: ensures receptionists are directed to their specific dashboard.

```mermaid
flowchart TD
Start(["ProtectedRoute"]) --> CheckLoading{"loading?"}
CheckLoading --> |Yes| ShowLoading["Show loading spinner"]
CheckLoading --> |No| CheckAuth{"user exists?"}
CheckAuth --> |No| ToLogin["Navigate to /login?state"]
CheckAuth --> |Yes| CheckRoles{"allowedRoles set?"}
CheckRoles --> |No| Diversion{"Default diversion?"}
Diversion --> |Yes| ToRoleHome["Navigate to role home"]
Diversion --> |No| Allow["Render children or Outlet"]
CheckRoles --> |Yes| HasProfile{"profile exists?"}
HasProfile --> |No| ToLogin2["Navigate to /login"]
HasProfile --> |Yes| RoleMatch{"allowedRoles includes profile.role?"}
RoleMatch --> |No| Unauthorized["Render UnauthorizedPage"]
RoleMatch --> |Yes| Allow
```

**Diagram sources**
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)

**Section sources**
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)

### Authentication Integration and AuthProvider
- Initializes session state and subscribes to auth state changes.
- Fetches user profile from the database upon login or session restoration.
- Exposes sign-in/sign-up/sign-out and profile refresh utilities.
- Provider conditionally renders children only after loading completes.

```mermaid
sequenceDiagram
participant BR as "BrowserRouter"
participant AP as "AuthProvider"
participant SB as "Supabase Auth"
participant DB as "Database (profiles)"
BR->>AP : Mount provider
AP->>SB : getSession()
SB-->>AP : {session}
alt session.user
AP->>DB : select * from profiles where id = user.id
DB-->>AP : profile
AP-->>BR : children (after loading=false)
else no session
AP-->>BR : children (after loading=false)
end
SB-->>AP : onAuthStateChange(event, session)
AP->>DB : fetchProfile(userId) on login
```

**Diagram sources**
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L107)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L1-L11)

**Section sources**
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L107)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L1-L11)

### Navigation Patterns and Programmatic Navigation
- Programmatic navigation:
  - DashboardHome uses navigation to quick actions and lists to drive users to relevant sections.
  - Login performs deterministic redirects based on role after successful sign-in.
- Link-based navigation:
  - Sidebar renders role-aware links and highlights active routes.
  - ProtectedRoute preserves the from location for seamless post-login redirection.

```mermaid
sequenceDiagram
participant DH as "DashboardHome.jsx"
participant SR as "ProtectedRoute.jsx"
participant SI as "Sidebar.jsx"
participant LG as "Login.jsx"
DH->>DH : onClick quick action
DH->>SR : useNavigate("/dashboard/patients?action=create")
SI->>SI : useLocation() + profile.role
SI-->>SI : render active link
LG->>LG : signIn(email, password)
LG->>LG : fetch profile(role)
LG->>LG : navigate(role === 'receptionist' ? '/dashboard/reception' : '/dashboard', {replace : true})
```

**Diagram sources**
- [DashboardHome.jsx](file://frontend/src/pages/DashboardHome.jsx#L275-L380)
- [Sidebar.jsx](file://frontend/src/components/Sidebar.jsx#L19-L112)
- [Login.jsx](file://frontend/src/pages/Login.jsx#L20-L75)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)

**Section sources**
- [DashboardHome.jsx](file://frontend/src/pages/DashboardHome.jsx#L275-L380)
- [Sidebar.jsx](file://frontend/src/components/Sidebar.jsx#L19-L112)
- [Login.jsx](file://frontend/src/pages/Login.jsx#L20-L75)

### Route Parameters Handling
- PatientsManager reads query parameters (e.g., action=search) to control UI behavior and filtering.
- AppointmentsManager manages view modes and date navigation via local state and date helpers.

```mermaid
flowchart TD
PM["PatientsManager.jsx"] --> SP["useSearchParams()"]
SP --> Action{"action='create'?"}
Action --> |Yes| OpenAdd["openAddModal()"]
SP --> Search{"search query?"}
Search --> |Yes| UpdateSearch["setSearchQuery(search)"]
AM["AppointmentsManager.jsx"] --> VM["viewMode state"]
AM --> CD["currentDate state"]
VM --> |month| MonthNav["nextPeriod()/prevPeriod()"]
CD --> |date range| Fetch["fetchAppointments()"]
```

**Diagram sources**
- [PatientsManager.jsx](file://frontend/src/pages/PatientsManager.jsx#L15-L55)
- [AppointmentsManager.jsx](file://frontend/src/pages/AppointmentsManager.jsx#L14-L66)

**Section sources**
- [PatientsManager.jsx](file://frontend/src/pages/PatientsManager.jsx#L15-L55)
- [AppointmentsManager.jsx](file://frontend/src/pages/AppointmentsManager.jsx#L14-L66)

### Dynamic Routing and Nested Routes
- Nested routes under /dashboard share a single layout via Outlet and DashboardLayout.
- Conditional rendering of routes based on allowedRoles ensures role-specific navigation.
- Default diversions ensure users land on the correct dashboard when visiting generic paths.

```mermaid
graph LR
D["/dashboard"] --> DL["DashboardLayout"]
DL --> IDX["index -> DashboardHome"]
DL --> APP["/appointments"]
DL --> PAT["/patients"]
DL --> AV["/availability"]
DL --> EAR["/earnings"]
DL --> RX["/prescriptions"]
DL --> REC["/reception"]
```

**Diagram sources**
- [App.jsx](file://frontend/src/App.jsx#L35-L53)
- [Layout.jsx](file://frontend/src/components/Layout.jsx#L5-L42)

**Section sources**
- [App.jsx](file://frontend/src/App.jsx#L35-L53)

### Route Guards and Unauthorized Handling
- UnauthorizedPage provides a clear, branded message and a link back to the user’s appropriate dashboard.
- Role mismatches are logged for debugging, and users are redirected to the unauthorized page.

**Section sources**
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L16-L47)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L89-L92)

### Relationship Between Routing and Component Rendering
- ProtectedRoute controls whether a page component renders or navigates away.
- Layout composes page components with shared UI (sidebar, header).
- AuthProvider ensures components can safely access user and profile data.

**Section sources**
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)
- [Layout.jsx](file://frontend/src/components/Layout.jsx#L5-L42)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L107)

### Lazy Loading Strategies
- Current implementation loads all page components synchronously.
- Recommended strategy: Use React.lazy and Suspense around route components to defer loading until navigation occurs. This reduces initial bundle size and improves perceived performance.

[No sources needed since this section provides general guidance]

## Dependency Analysis
- App.jsx depends on ProtectedRoute, Layout, and page components.
- ProtectedRoute depends on AuthContext and react-router-dom’s Navigate/Outlet/useLocation.
- AuthProvider depends on Supabase client for session and profile management.
- Sidebar depends on useLocation and profile role to render role-aware navigation.

```mermaid
graph TB
APP["App.jsx"] --> PR["ProtectedRoute.jsx"]
APP --> LYT["Layout.jsx"]
APP --> PAGES["Page components"]
PR --> AC["AuthContext.jsx"]
AC --> SB["supabaseClient.js"]
LYT --> SBAR["Sidebar.jsx"]
SBAR --> AC
```

**Diagram sources**
- [App.jsx](file://frontend/src/App.jsx#L26-L59)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L107)
- [Layout.jsx](file://frontend/src/components/Layout.jsx#L5-L42)
- [Sidebar.jsx](file://frontend/src/components/Sidebar.jsx#L19-L112)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L1-L11)

**Section sources**
- [package.json](file://frontend/package.json#L27-L31)

## Performance Considerations
- Bundle size: Consider code-splitting route components to reduce initial load.
- Navigation: Prefer shallow routing and avoid unnecessary re-renders by leveraging stable refs and memoization in page components.
- Auth state: Keep profile fetching minimal and cache where appropriate to avoid redundant network calls.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Stuck on loading during auth:
  - Verify AuthProvider resolves session and profile before rendering children.
  - Check Supabase keys and network connectivity.
- Redirect loops after login:
  - Confirm login flow fetches profile and navigates deterministically by role.
- Access denied page appears unexpectedly:
  - Ensure profile.role matches allowedRoles in ProtectedRoute.
  - Check default diversion logic for role-specific homes.
- Sidebar navigation incorrect:
  - Validate role-aware nav items and active link detection logic.

**Section sources**
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L107)
- [Login.jsx](file://frontend/src/pages/Login.jsx#L20-L75)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)
- [Sidebar.jsx](file://frontend/src/components/Sidebar.jsx#L19-L112)

## Conclusion
MedVita’s routing system combines React Router’s nested routing with a robust ProtectedRoute guard and a centralized AuthProvider. The design cleanly separates authentication, authorization, and navigation concerns, enabling role-aware experiences and predictable user flows. Adopting code splitting and refining navigation state management will further enhance performance and maintainability.