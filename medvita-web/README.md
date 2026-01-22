# MedVita - Modern Healthcare Management System

MedVita is a comprehensive healthcare management platform built with React, Vite, and Supabase. It features role-based access for doctors and patients, allowing efficient management of appointments, prescriptions, and medical history in a modern, responsive interface.

![MedVita Dashboard](./public/vite.svg) *Replace with actual screenshot if available*

## 🚀 Tech Stack

- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4), Headless UI, Framer Motion
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **State Management:** React Context API
- **Date Handling:** date-fns

## ✨ Features

### 🩺 For Doctors
- **Patient Management:** View and search patient records, medical history, and timeline.
- **Appointment Management:** View upcoming schedule, manage bookings.
- **Availability Settings:** Configure weekly working hours.
- **Prescriptions:** Create digital prescriptions for patients.
- **Analytics:** Dashboard with patient statistics and appointment trends.

### 👤 For Patients
- **Appointment Booking:** Easy-to-use calendar interface to book slots.
- **Medical History:** Access past appointments and prescriptions.
- **Dashboard:** Overview of health stats and upcoming visits.

### 🎨 UI/UX
- **Premium Design:** Glassmorphism effects, modern typography, and clean layout.
- **Dark Mode:** Fully supported dark theme with seamless switching.
- **Responsive:** Optimized for desktop, tablet, and mobile devices.
- **Accessibility:** WCAG AA+ compliant colors and semantic HTML.

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/MedVita.git
   cd MedVita/medvita-web
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `medvita-web` directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## 🗄️ Database Setup

The project uses Supabase. You can find the database schema in `schema.sql` (or `supabase_schema.sql`).
Run the SQL scripts in your Supabase SQL Editor to set up the necessary tables and policies.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
