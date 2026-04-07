import { Navigate, Outlet, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldOff, ArrowLeft, AlertTriangle } from 'lucide-react'

// Maps each role to their home route
const ROLE_HOME = {
  doctor: '/dashboard',
  patient: '/dashboard',
  receptionist: '/dashboard/reception',
}

/**
 * Enterprise-grade Unauthorized Page
 * Use the developer context and props to provide clear navigation and feedback.
 */
function UnauthorizedPage({ userRole }) {
  const home = ROLE_HOME[userRole] || '/dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-400/5 dark:bg-red-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="text-center max-w-sm relative z-10">
        <div className="w-24 h-24 mx-auto mb-8 bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl flex items-center justify-center border border-red-100 dark:border-red-900/30 group">
          <ShieldOff className="w-12 h-12 text-red-500 group-hover:scale-110 transition-transform duration-300" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
          Access Denied
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-base leading-relaxed font-medium">
          You don't have permission to view this page. This area is restricted to a different role.
        </p>

        <Link
          to={home}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to My Dashboard
        </Link>
      </div>
    </div>
  )
}

/**
 * Higher-Order Component for Protected Routes.
 * Implements strict role-based access control and session management.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, profile, loading, profileError } = useAuth()
  const location = useLocation()

  // 1. Loading State: Wait for both auth session and profile data.
  // We ensure loading is only false when we have (or definitely don't have) a profile.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-500/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
          </div>
          <div className="text-center">
            <p className="text-slate-900 dark:text-white font-bold text-lg mb-1">Authenticating...</p>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Please wait while we verify your session</p>
          </div>
        </div>
      </div>
    )
  }

  // 2. Unauthenticated State: Redirect to login but keep current location for post-login redirect
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Profile missing: show helpful error instead of silent redirect
  if (!profile && profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 mx-auto mb-8 bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
            <AlertTriangle className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Profile Sync Issue</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            Your account was authenticated but we couldn't load your profile. This usually resolves on refresh.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 px-8 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // 4. Role-Based Access: Check if profile role matches allowed roles
  if (allowedRoles) {
    if (!profile) {
      console.error('[Auth] Profile missing for authenticated user:', user.id)
      return <Navigate to="/login" replace />
    }

    if (!allowedRoles.includes(profile.role)) {
      console.warn(`[Auth] Access denied for ${profile.role} at ${location.pathname}. Allowed: ${allowedRoles.join(', ')}`)
      return <UnauthorizedPage userRole={profile.role} />
    }
  }

  // 4. Default Diversions: Ensure users are on their correct home route
  // For example, if a receptionist lands on exactly '/dashboard', move them to their specific one.
  if (
    !allowedRoles &&
    profile?.role === 'receptionist' &&
    location.pathname === '/dashboard'
  ) {
    return <Navigate to="/dashboard/reception" replace />
  }

  return children ? children : <Outlet />
}

