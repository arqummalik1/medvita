import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to their appropriate dashboard if they are logged in but wrong role
    // Or just show unauthorized.
    return <div className="p-8">Unauthorized access for role: {profile.role}</div>
  }

  return children ? children : <Outlet />
}
