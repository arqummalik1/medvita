import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldOff } from 'lucide-react'

// Maps each role to their home route
const ROLE_HOME = {
  doctor: '/dashboard',
  patient: '/dashboard',
  receptionist: '/dashboard/reception',
}

function UnauthorizedPage({ userRole }) {
  const home = ROLE_HOME[userRole] || '/dashboard'
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <ShieldOff className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
          You don't have permission to view this page. This area is restricted to a different role.
        </p>
        <a
          href={home}
          className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          Go to My Dashboard
        </a>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading your session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Role-based access check: only enforce when allowedRoles is explicitly provided
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <UnauthorizedPage userRole={profile.role} />
  }

  // If a receptionist lands on the root /dashboard index (not a nested route like /reception),
  // redirect them to their home. We check the exact path to avoid infinite redirect loops.
  if (
    !allowedRoles &&
    profile?.role === 'receptionist' &&
    location.pathname === '/dashboard'
  ) {
    return <Navigate to="/dashboard/reception" replace />
  }

  return children ? children : <Outlet />
}
