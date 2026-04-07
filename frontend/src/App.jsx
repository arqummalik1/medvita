import { Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ReceptionistSignup from './pages/ReceptionistSignup'
import ReceptionDashboard from './pages/ReceptionDashboard'
import DashboardHome from './pages/DashboardHome'
import PatientsManager from './pages/PatientsManager'
import AvailabilityManager from './pages/AvailabilityManager'
import AppointmentsManager from './pages/AppointmentsManager'
import PrescriptionsViewer from './pages/PrescriptionsViewer'
import EarningsManager from './pages/EarningsManager'
import Chatbot from './pages/Chatbot'

function DashboardLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/staff-signup" element={<ReceptionistSignup />} />

        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />

            {/* Shared Routes */}
            <Route path="appointments" element={<ProtectedRoute allowedRoles={['patient', 'doctor']}><AppointmentsManager /></ProtectedRoute>} />

            {/* Doctor Routes */}
            <Route path="patients" element={<ProtectedRoute allowedRoles={['doctor']}><PatientsManager /></ProtectedRoute>} />
            <Route path="availability" element={<ProtectedRoute allowedRoles={['doctor']}><AvailabilityManager /></ProtectedRoute>} />
            <Route path="earnings" element={<ProtectedRoute allowedRoles={['doctor']}><EarningsManager /></ProtectedRoute>} />

            {/* Patient Routes */}
            <Route path="prescriptions" element={<ProtectedRoute allowedRoles={['patient', 'doctor']}><PrescriptionsViewer /></ProtectedRoute>} />

            {/* Receptionist Routes */}
            <Route path="reception" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionDashboard /></ProtectedRoute>} />
          </Route>
        </Route>

        <Route path="/chatbot" element={<ProtectedRoute><Layout><Chatbot /></Layout></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  )
}

export default App
