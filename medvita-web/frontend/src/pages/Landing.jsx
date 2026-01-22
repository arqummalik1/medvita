import { Link } from 'react-router-dom'
import { Activity, ShieldCheck, Heart, ArrowRight } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse duration-[8s]"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-teal-400/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-pulse duration-[10s]"></div>
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-pulse duration-[12s]"></div>

      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5 flex items-center gap-3 group">
              <div className="bg-white/50 dark:bg-slate-800/50 p-2.5 rounded-xl backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">MedVita</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex gap-3">
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-primary shadow-blue-500/20">
                Sign up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="relative isolate px-6 pt-14 lg:px-8 min-h-screen flex items-center justify-center">
        <div className="mx-auto max-w-4xl py-20">
          <div className="glass-panel rounded-[2.5rem] p-8 sm:p-16 text-center shadow-2xl border-white/40 dark:border-white/10 relative overflow-hidden group">
            
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl mb-8 leading-tight">
              <span className="block mb-2">Healthcare Reimagined</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-400 pb-2">
                Simple. Secure. Smart.
              </span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              MedVita streamlines the connection between doctors and patients. Experience a seamless, secure, and intelligent way to manage appointments, prescriptions, and health records.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="btn btn-primary px-8 py-3.5 text-base shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 w-full sm:w-auto"
              >
                Get Started Free
              </Link>
              <Link 
                to="/login" 
                className="btn btn-secondary px-8 py-3.5 text-base w-full sm:w-auto flex items-center justify-center gap-2 group/link"
              >
                Sign In <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="glass-card p-6 rounded-2xl flex flex-col items-center hover:-translate-y-1 transition-transform duration-300 border-white/60 dark:border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white mb-1">Secure & Private</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">End-to-end encryption</span>
              </div>
              
              <div className="glass-card p-6 rounded-2xl flex flex-col items-center hover:-translate-y-1 transition-transform duration-300 border-white/60 dark:border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mb-4 text-pink-600 dark:text-pink-400">
                  <Heart className="h-6 w-6" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white mb-1">Patient Focused</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Designed for care</span>
              </div>
              
              <div className="glass-card p-6 rounded-2xl flex flex-col items-center hover:-translate-y-1 transition-transform duration-300 border-white/60 dark:border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                  <Activity className="h-6 w-6" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white mb-1">Real-time Updates</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Instant notifications</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
