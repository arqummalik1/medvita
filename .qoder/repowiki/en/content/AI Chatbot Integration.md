# AI Chatbot Integration

<cite>
**Referenced Files in This Document**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx)
- [App.jsx](file://frontend/src/App.jsx)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js)
- [schema.sql](file://backend/schema.sql)
- [googleCalendar.js](file://frontend/src/lib/googleCalendar.js)
- [AppointmentsManager.jsx](file://frontend/src/pages/AppointmentsManager.jsx)
- [PatientsManager.jsx](file://frontend/src/pages/PatientsManager.jsx)
- [PrescriptionsViewer.jsx](file://frontend/src/pages/PrescriptionsViewer.jsx)
- [SettingsModal.jsx](file://frontend/src/components/SettingsModal.jsx)
- [send-prescription-email/index.ts](file://supabase/functions/send-prescription-email/index.ts)
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
10. [Appendices](#appendices)

## Introduction
This document describes the AI chatbot integration for MedVita’s conversational assistance system. It covers the Gemini AI API integration, conversation management, and natural language processing capabilities. It also explains the chatbot architecture, including intent recognition, context management, and response generation; fallback mechanisms for unavailable AI responses; human agent handoff procedures; conversation logging; integration with patient information, appointment scheduling, and common healthcare inquiries; customization options for chatbot personality and response templates; and privacy and compliance considerations for handling health information securely.

## Project Structure
The chatbot resides in the frontend under the pages directory and integrates with Supabase for authentication and data access. It leverages environment variables for API keys and routes to protected dashboards. The backend schema defines the data model for profiles, patients, appointments, and prescriptions, enabling contextual responses and navigation.

```mermaid
graph TB
subgraph "Frontend"
A["Chatbot.jsx<br/>Handles user input, Gemini API, fallbacks"]
B["App.jsx<br/>Routes and layout"]
C["AuthContext.jsx<br/>Auth state and profile"]
D["ProtectedRoute.jsx<br/>Role-based access control"]
E["supabaseClient.js<br/>Supabase client"]
F["googleCalendar.js<br/>Google Calendar integration"]
G["AppointmentsManager.jsx<br/>Appointments UI"]
H["PatientsManager.jsx<br/>Patients UI"]
I["PrescriptionsViewer.jsx<br/>Prescriptions UI"]
J["SettingsModal.jsx<br/>Doctor settings"]
end
subgraph "Backend"
K["schema.sql<br/>Tables: profiles, patients, appointments, prescriptions"]
L["send-prescription-email/index.ts<br/>Email function"]
end
A --> E
A --> C
A --> B
B --> D
D --> C
A --> K
G --> K
H --> K
I --> K
J --> K
F --> G
L --> I
```

**Diagram sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L1-L201)
- [App.jsx](file://frontend/src/App.jsx#L1-L62)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L1-L108)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L1-L108)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L1-L11)
- [googleCalendar.js](file://frontend/src/lib/googleCalendar.js#L1-L199)
- [AppointmentsManager.jsx](file://frontend/src/pages/AppointmentsManager.jsx#L1-L577)
- [PatientsManager.jsx](file://frontend/src/pages/PatientsManager.jsx#L1-L667)
- [PrescriptionsViewer.jsx](file://frontend/src/pages/PrescriptionsViewer.jsx#L1-L273)
- [SettingsModal.jsx](file://frontend/src/components/SettingsModal.jsx#L1-L672)
- [schema.sql](file://backend/schema.sql#L1-L274)
- [send-prescription-email/index.ts](file://supabase/functions/send-prescription-email/index.ts#L1-L193)

**Section sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L1-L201)
- [App.jsx](file://frontend/src/App.jsx#L1-L62)
- [schema.sql](file://backend/schema.sql#L1-L274)

## Core Components
- Chatbot UI and logic: Manages messages, sends user input to Gemini, applies fallbacks, and renders responses with links to relevant dashboards.
- Authentication and routing: Protects routes and ensures only authenticated users with proper roles can access chatbot and related dashboards.
- Data access: Uses Supabase client to query profiles, patients, appointments, and prescriptions for contextual responses.
- External integrations: Google Calendar sync for appointments; email function for prescriptions.

**Section sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L1-L201)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L1-L108)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L1-L108)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L1-L11)
- [googleCalendar.js](file://frontend/src/lib/googleCalendar.js#L1-L199)

## Architecture Overview
The chatbot architecture combines a React UI with a Gemini API for NLP and a Supabase backend for data. The system supports role-based access control and integrates with healthcare workflows such as appointments and prescriptions.

```mermaid
sequenceDiagram
participant U as "User"
participant CB as "Chatbot.jsx"
participant API as "Gemini API"
participant SB as "Supabase"
participant RT as "ProtectedRoute.jsx"
U->>CB : "Type message"
CB->>RT : "Verify auth and role"
alt "Known command"
CB-->>U : "Direct response with navigation"
else "General query"
CB->>API : "POST /generateContent"
API-->>CB : "AI response"
CB-->>U : "Display AI response"
else "API error"
CB-->>U : "Fallback response"
end
CB->>SB : "Fetch profiles/doctors/patients/appointments"
SB-->>CB : "Data for context"
```

**Diagram sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L22-L103)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)
- [supabaseClient.js](file://frontend/src/lib/supabaseClient.js#L1-L11)

## Detailed Component Analysis

### Chatbot Component
Responsibilities:
- Accepts user input and displays messages.
- Detects known commands (navigation, availability) and responds directly.
- Sends general queries to Gemini API with a tailored prompt.
- Applies fallbacks when API is unavailable or returns errors.
- Renders loading indicators and links to relevant dashboards.

Key behaviors:
- Command detection: Checks for keywords like “book appointment” and “doctor availability.”
- Gemini integration: Sends structured prompts with context and role instructions.
- Fallback logic: Provides helpful offline responses and guidance.
- Navigation: Embeds links to the Appointments page for seamless handoff.

```mermaid
flowchart TD
Start(["User sends message"]) --> CheckCmd["Check for known commands"]
CheckCmd --> |Match| CmdResp["Generate command response"]
CheckCmd --> |No match| HasKey{"API key present?"}
HasKey --> |Yes| CallGemini["Call Gemini API"]
HasKey --> |No| MockResp["Generate mock response"]
CallGemini --> ApiOK{"API success?"}
ApiOK --> |Yes| ParseResp["Parse candidate text"]
ApiOK --> |No| Fallback["Provide fallback response"]
ParseResp --> Render["Render bot response"]
MockResp --> Render
Fallback --> Render
Render --> End(["Done"])
```

**Diagram sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L22-L103)

**Section sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L1-L201)

### Authentication and Authorization
- AuthContext manages session state, profile retrieval, and exposes sign-in/sign-out.
- ProtectedRoute enforces role-based access control and redirects unauthorized users.
- Combined with Chatbot routing, only authenticated users can access the chatbot interface.

```mermaid
sequenceDiagram
participant U as "User"
participant AR as "App.jsx"
participant PR as "ProtectedRoute.jsx"
participant AC as "AuthContext.jsx"
U->>AR : "Navigate to /chatbot"
AR->>PR : "Wrap with ProtectedRoute"
PR->>AC : "Check auth and profile"
alt "Unauthenticated"
PR-->>U : "Redirect to /login"
else "Authenticated"
PR-->>U : "Render Chatbot"
end
```

**Diagram sources**
- [App.jsx](file://frontend/src/App.jsx#L55-L56)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L9-L107)

**Section sources**
- [AuthContext.jsx](file://frontend/src/context/AuthContext.jsx#L1-L108)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L1-L108)
- [App.jsx](file://frontend/src/App.jsx#L1-L62)

### Data Model and Contextual Responses
The backend schema defines tables for profiles, patients, appointments, and prescriptions. The chatbot uses these to tailor responses and provide navigation to relevant dashboards.

```mermaid
erDiagram
PROFILES {
uuid id PK
text email
text role
text full_name
uuid employer_id
text clinic_code
boolean google_calendar_sync_enabled
timestamp created_at
}
PATIENTS {
uuid id PK
timestamp created_at
text name
int age
text sex
text blood_pressure
int heart_rate
text email
text patient_id
uuid doctor_id
uuid user_id
}
APPOINTMENTS {
uuid id PK
timestamp created_at
uuid patient_id
text patient_name
uuid doctor_id
date date
time time
text status
}
PRESCRIPTIONS {
uuid id PK
timestamp created_at
uuid patient_id
uuid doctor_id
text prescription_text
text file_url
}
PROFILES ||--o{ PATIENTS : "doctor_id"
PROFILES ||--o{ APPOINTMENTS : "doctor_id"
PATIENTS ||--o{ APPOINTMENTS : "patient_id"
PROFILES ||--o{ PRESCRIPTIONS : "doctor_id"
PATIENTS ||--o{ PRESCRIPTIONS : "patient_id"
```

**Diagram sources**
- [schema.sql](file://backend/schema.sql#L4-L274)

**Section sources**
- [schema.sql](file://backend/schema.sql#L1-L274)

### External Integrations
- Google Calendar: The chatbot can guide users to the Appointments page; the appointments manager supports Google Calendar sync for automatic event creation.
- Email Function: A serverless function generates and emails prescriptions as PDFs, embedding health tips and branding.

```mermaid
sequenceDiagram
participant CB as "Chatbot.jsx"
participant AM as "AppointmentsManager.jsx"
participant GC as "googleCalendar.js"
participant PF as "send-prescription-email/index.ts"
CB-->>AM : "Guide to /dashboard/appointments"
AM->>GC : "Sync appointment to Google Calendar"
PF-->>PF : "Generate PDF and send email"
```

**Diagram sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L37-L46)
- [AppointmentsManager.jsx](file://frontend/src/pages/AppointmentsManager.jsx#L134-L180)
- [googleCalendar.js](file://frontend/src/lib/googleCalendar.js#L126-L178)
- [send-prescription-email/index.ts](file://supabase/functions/send-prescription-email/index.ts#L1-L193)

**Section sources**
- [googleCalendar.js](file://frontend/src/lib/googleCalendar.js#L1-L199)
- [send-prescription-email/index.ts](file://supabase/functions/send-prescription-email/index.ts#L1-L193)

## Dependency Analysis
- Frontend dependencies include React, React Router, Supabase JS client, Tailwind utilities, and Lucide icons.
- The chatbot depends on Supabase for authentication and data access and on environment variables for Gemini and Supabase credentials.
- The backend schema defines row-level security policies and foreign key relationships to support secure and contextual chatbot responses.

```mermaid
graph LR
Pkg["package.json"] --> R["react"]
Pkg --> RR["react-router-dom"]
Pkg --> SB["@supabase/supabase-js"]
Pkg --> LC["lucide-react"]
CB["Chatbot.jsx"] --> SB
CB --> GC["googleCalendar.js"]
CB --> AM["AppointmentsManager.jsx"]
CB --> PV["PrescriptionsViewer.jsx"]
CB --> PM["PatientsManager.jsx"]
CB --> SC["schema.sql"]
```

**Diagram sources**
- [package.json](file://frontend/package.json#L13-L31)
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L1-L201)
- [googleCalendar.js](file://frontend/src/lib/googleCalendar.js#L1-L199)
- [AppointmentsManager.jsx](file://frontend/src/pages/AppointmentsManager.jsx#L1-L577)
- [PrescriptionsViewer.jsx](file://frontend/src/pages/PrescriptionsViewer.jsx#L1-L273)
- [PatientsManager.jsx](file://frontend/src/pages/PatientsManager.jsx#L1-L667)
- [schema.sql](file://backend/schema.sql#L1-L274)

**Section sources**
- [package.json](file://frontend/package.json#L1-L50)
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L1-L201)

## Performance Considerations
- Gemini API latency: Implement request timeouts and caching for repeated queries to improve perceived responsiveness.
- Debouncing user input: Add debouncing to reduce unnecessary API calls during rapid typing.
- UI rendering: Virtualize long conversation lists and lazy-load images/logos to maintain smooth scrolling.
- Environment configuration: Ensure API keys are configured to avoid extra error handling overhead.

## Troubleshooting Guide
Common issues and resolutions:
- Missing Gemini API key: The chatbot falls back to a mock response and instructs to add the key. Verify environment variables and redeploy.
- Gemini API errors: The chatbot logs errors and returns a friendly fallback message; check network connectivity and quota limits.
- Authentication failures: ProtectedRoute redirects unauthenticated users to login; ensure session persistence and profile retrieval succeed.
- Data access errors: If Supabase queries fail, verify row-level security policies and table relationships defined in the schema.

Operational checks:
- Confirm environment variables for Gemini and Supabase are present in the runtime environment.
- Validate Supabase connection and policies for profiles, patients, appointments, and prescriptions.
- Test Google Calendar integration and email function for end-to-end flows.

**Section sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L48-L93)
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L76-L93)
- [schema.sql](file://backend/schema.sql#L30-L274)

## Conclusion
MedVita’s chatbot integrates Gemini AI with a secure, role-aware frontend and a well-defined backend schema. It provides contextual responses, graceful fallbacks, and seamless navigation to healthcare workflows such as appointments and prescriptions. With proper configuration and monitoring, the system delivers a reliable conversational assistant aligned with healthcare needs and user expectations.

## Appendices

### Customization Options
- Chatbot personality and prompts: Modify the prompt sent to Gemini in the chatbot component to adjust tone and capabilities.
- Response templates: Extend command handling to support templated responses for common queries.
- Domain-specific knowledge: Enhance the prompt with clinic-specific guidelines and disclaimers.
- Doctor customization: Use the Settings modal to personalize prescription branding and details.

**Section sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L50-L71)
- [SettingsModal.jsx](file://frontend/src/components/SettingsModal.jsx#L1-L672)

### Privacy and Compliance Considerations
- Data minimization: Avoid requesting sensitive information unless necessary; rely on Supabase data for context.
- Secure transport: Ensure all API calls use HTTPS; configure environment variables securely.
- Access control: Enforce role-based access via ProtectedRoute and Supabase RLS policies.
- Logging: Avoid storing sensitive health information in logs; sanitize messages before logging.
- Consent and transparency: Provide clear messaging about AI assistance and data usage.

**Section sources**
- [ProtectedRoute.jsx](file://frontend/src/components/ProtectedRoute.jsx#L53-L106)
- [schema.sql](file://backend/schema.sql#L30-L274)

### Integration Examples
- Appointment booking: The chatbot detects intent and navigates to the Appointments page; the manager handles booking and optional Google Calendar sync.
- Prescriptions: The chatbot can guide users to the Prescriptions Viewer; the email function sends branded PDFs with health tips.

**Section sources**
- [Chatbot.jsx](file://frontend/src/pages/Chatbot.jsx#L37-L46)
- [AppointmentsManager.jsx](file://frontend/src/pages/AppointmentsManager.jsx#L134-L180)
- [PrescriptionsViewer.jsx](file://frontend/src/pages/PrescriptionsViewer.jsx#L1-L273)
- [send-prescription-email/index.ts](file://supabase/functions/send-prescription-email/index.ts#L1-L193)