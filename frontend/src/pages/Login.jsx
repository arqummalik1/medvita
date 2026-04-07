import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity, Lock, Mail, Stethoscope, Heart, CalendarDays, ShieldCheck, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

const features = [
  {
    icon: Stethoscope,
    title: 'Doctor Dashboard',
    description: 'Patient management, prescriptions, scheduling',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  {
    icon: Heart,
    title: 'Patient Portal',
    description: 'Book appointments, view prescriptions',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
  {
    icon: CalendarDays,
    title: 'Smart Scheduling',
    description: 'AI-powered appointment management',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Compliant',
    description: 'HIPAA-compliant data protection',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [toast, setToast] = useState(null)
  const [formError, setFormError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const showToast = (type, message) => setToast({ type, message })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setToast(null)
    setFormError(null)

    try {
      const { data, error } = await signIn(email, password)

      if (error) throw error
      if (!data.user) throw new Error('Authentication failed: No user data returned.')

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.warn('[Auth] Redirection notice: Profile not found, defaulting to base dashboard.', profileError)
      }

      showToast('success', 'Signed in successfully! Redirecting...')

      const role = profileData?.role || 'patient'

      if (role === 'receptionist') {
        navigate('/dashboard/reception', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }

    } catch (error) {
      console.error('[Auth] Login error:', error)
      let message = 'Login failed. Please try again.'

      if (error.message?.includes('Invalid login credentials')) {
        message = 'Incorrect email or password. Please try again.'
      } else if (error.message?.includes('Email not confirmed')) {
        message = 'Please confirm your email address before logging in.'
      } else if (error.status === 429) {
        message = 'Too many attempts. Please try again later.'
      }

      setFormError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0B1120] overflow-hidden">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={clsx(
              'fixed top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] p-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] border backdrop-blur-md',
              toast.type === 'success'
                ? 'bg-emerald-500 border-emerald-400 text-white'
                : 'bg-red-500 border-red-400 text-white'
            )}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-5 h-5 shrink-0" />
              : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="font-medium text-sm">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative flex-col justify-center px-12 xl:px-20">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 mb-8">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">MedVita Healthcare Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Modern Healthcare
            </span>
            <br />
            <span className="text-white">Management</span>
          </h1>

          {/* Description */}
          <p className="text-slate-400 text-lg mb-10 max-w-md">
            Streamline your medical practice with intelligent patient management, digital prescriptions, and seamless appointment scheduling.
          </p>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${feature.bgColor} mb-3`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Form Card */}
        <div className="w-full max-w-md">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
              <p className="text-slate-400 text-sm">Sign in to access your healthcare dashboard</p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
                  <div className="w-4 h-4 rounded-full border border-emerald-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setFormError(null)
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
                  <div className="w-4 h-4 rounded-full border border-emerald-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setFormError(null)
                    }}
                  />
                </div>
              </div>

              {/* Error Display (shown conditionally) */}
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="w-4 h-4 rounded-full border border-red-400 flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-xs">!</span>
                  </div>
                  <span className="text-red-400 text-xs">{formError}</span>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>

              {/* Sign Up Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-slate-400">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
