import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, User, Stethoscope } from 'lucide-react'
import { RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import ThemeToggle from '../components/ThemeToggle'

const roles = [
  { name: 'Patient', description: 'Book appointments & view prescriptions' },
  { name: 'Doctor', description: 'Manage patients & prescriptions' },
]

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState(roles[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, role.name.toLowerCase(), fullName)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
       <div className="absolute top-4 right-4 z-50">
         <ThemeToggle />
       </div>
       
       {/* Decorative background elements */}
       <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse duration-[4s]"></div>
       <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-400/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse duration-[5s]"></div>

      <div className="max-w-md w-full space-y-8 glass-panel p-10 rounded-3xl relative z-10 shadow-2xl">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Join MedVita to manage your healthcare journey
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  required
                  className="input-field pl-10"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field pl-10"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <RadioGroup value={role} onChange={setRole}>
            <RadioGroup.Label className="sr-only">Role</RadioGroup.Label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((roleOption) => (
                <RadioGroup.Option
                  key={roleOption.name}
                  value={roleOption}
                  className={({ active, checked }) =>
                    clsx(
                      active ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : '',
                      checked
                        ? 'bg-blue-600 border-transparent text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80',
                      'relative border rounded-xl px-3 py-3 flex flex-col items-center justify-center text-sm font-medium sm:flex-1 cursor-pointer focus:outline-none transition-all duration-200'
                    )
                  }
                >
                  <RadioGroup.Label as="span">{roleOption.name}</RadioGroup.Label>
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-base shadow-xl shadow-blue-500/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
             <p className="text-sm text-slate-600 dark:text-slate-400">
               Already have an account?{' '}
               <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                 Sign in
               </Link>
             </p>
          </div>
        </form>
      </div>
    </div>
  )
}
