import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, User, Activity, CheckCircle2, AlertCircle } from 'lucide-react'
import { RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import { supabase } from '../lib/supabaseClient'
import ThemeToggle from '../components/ThemeToggle'
import { motion, AnimatePresence } from 'framer-motion'

const roles = [
  { name: 'patient', label: 'Patient', description: 'Book appointments & view prescriptions' },
  { name: 'doctor', label: 'Doctor', description: 'Manage patients & prescriptions' },
]

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState(roles[0])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role.name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (user) {
        setToast({ type: 'success', message: 'Account created successfully! Redirecting...' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setToast({ type: 'error', message: error.message || 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">

      {/* Background blobs — NO pink/purple */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 dark:opacity-30 animate-pulse duration-[15s]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-emerald-400/15 dark:bg-emerald-500/8 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 dark:opacity-25 animate-pulse duration-[18s]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 dark:opacity-20 animate-pulse duration-[12s]" />
      </div>

      <div className="w-full max-w-xl p-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 dark:border-slate-700/50 relative z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl" />

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
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
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400 shrink-0" />
              )}
              <p className="font-medium text-sm">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mb-10 relative z-10">
          {/* App icon — cyan to emerald */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 mb-6 group shadow-xl shadow-cyan-500/30 hover:scale-110 transition-transform duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <Activity className="h-10 w-10 text-white relative z-10" />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Create Account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Join MedVita today</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-cyan-500">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  className="input-field pl-12"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-cyan-500">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field pl-12"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-cyan-500">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field pl-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Role selector — cyan to blue, NO purple */}
          <RadioGroup value={role} onChange={setRole} className="relative z-10">
            <RadioGroup.Label className="sr-only">Role</RadioGroup.Label>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {roles.map((roleOption) => (
                <RadioGroup.Option
                  key={roleOption.name}
                  value={roleOption}
                  className={({ active, checked }) =>
                    clsx(
                      active ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-800' : '',
                      checked
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500 border-transparent text-white shadow-xl shadow-cyan-500/30 scale-105'
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:border-cyan-300 dark:hover:border-cyan-600',
                      'relative border rounded-2xl px-4 py-4 flex flex-col items-center justify-center text-sm font-bold cursor-pointer focus:outline-none transition-all duration-300 backdrop-blur-sm'
                    )
                  }
                >
                  <RadioGroup.Label as="span">{roleOption.label}</RadioGroup.Label>
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>

          <div className="relative z-10">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-2xl text-base shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {loading ? (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                <span className="relative z-10">Create Account</span>
              )}
            </button>
          </div>

          <div className="text-center pt-2 relative z-10">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
