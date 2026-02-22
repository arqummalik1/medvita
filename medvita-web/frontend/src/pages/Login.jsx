import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity, Lock, Mail } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  useAuth()
  const navigate = useNavigate()

  const showToast = (type, message) => setToast({ type, message })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setToast(null)

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.warn('Could not fetch profile for role-based routing:', profileError)
      }

      showToast('success', 'Signed in successfully! Redirecting...')

      const role = profileData?.role
      setTimeout(() => {
        if (role === 'receptionist') {
          navigate('/dashboard/reception')
        } else {
          navigate('/dashboard')
        }
      }, 1200)

    } catch (error) {
      console.error('Login error:', error)
      if (error.message?.includes('Invalid login credentials')) {
        showToast('error', 'Incorrect email or password. Please try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        showToast('error', 'Please confirm your email address before logging in.')
      } else {
        showToast('error', error.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">

      {/* Background blobs — NO pink/purple */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-[120px] opacity-60 dark:opacity-30 animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-400/15 dark:bg-emerald-500/8 rounded-full blur-[120px] opacity-50 dark:opacity-25 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-[100px] opacity-40 dark:opacity-20 animate-pulse" />
      </div>

      <div className="w-full max-w-md p-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 dark:border-slate-700/50 relative z-10 mx-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={clsx(
                'absolute -top-16 left-1/2 -translate-x-1/2 w-[90%] p-4 rounded-2xl shadow-xl backdrop-blur-md border flex items-center gap-3 z-50',
                toast.type === 'success'
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200'
              )}
            >
              {toast.type === 'success'
                ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                : <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />}
              <p className="font-medium text-sm">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="text-center mb-10 relative z-10">
          {/* App icon — cyan to emerald, no indigo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 mb-6 shadow-xl shadow-cyan-500/30 hover:scale-110 transition-transform duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            <Activity className="h-10 w-10 text-white relative z-10" />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Sign in to your MedVita account</p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field pl-10"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input-field pl-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-2xl text-base shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              {loading ? (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <Loader2 className="animate-spin h-5 w-5" />
                  Signing in...
                </span>
              ) : (
                <span className="relative z-10">Sign in</span>
              )}
            </button>
          </div>

          <div className="text-center space-y-2 pt-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors hover:underline underline-offset-2">
                Create one now
              </Link>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Clinic staff?{' '}
              <Link to="/staff-signup" className="font-bold text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline underline-offset-2">
                Register with Doctor's Code →
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
