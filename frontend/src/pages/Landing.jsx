import { Link } from 'react-router-dom'
import { Activity, ShieldCheck, Heart, ArrowRight, Star, Users } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-50 via-emerald-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
      {/* Background blobs — cyan, emerald, blue only */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 dark:opacity-30 animate-pulse duration-[15s]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-emerald-400/15 dark:bg-emerald-500/8 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 dark:opacity-25 animate-pulse duration-[18s]" />
      <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 dark:opacity-20 animate-pulse duration-[12s]" />

      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <nav className="flex items-center justify-between p-6 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5 flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-2.5 rounded-xl shadow-xl shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <Activity className="h-6 w-6 text-white relative z-10" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">MedVita</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex gap-3">
              <Link to="/login" className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Log in
              </Link>
              <Link to="/signup" className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5">
                Sign up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="relative isolate px-6 pt-14 lg:px-8 min-h-screen flex items-center justify-center">
        <div className="mx-auto max-w-4xl py-20">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-[3rem] p-8 sm:p-20 text-center shadow-2xl border border-white/50 dark:border-slate-700/50 relative overflow-hidden group">

            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/8 via-transparent to-blue-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl" />

            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 border border-cyan-200/50 dark:border-cyan-800/50 text-cyan-600 dark:text-cyan-400 text-sm font-bold mb-8 shadow-lg relative z-10">
              <Star className="w-4 h-4 fill-cyan-600 dark:fill-cyan-400" />
              <span>Premium Healthcare Experience</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl mb-8 leading-tight relative z-10">
              <span className="block mb-2">Healthcare Reimagined</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600 dark:from-cyan-400 dark:via-blue-400 dark:to-emerald-400 pb-2">
                Simple. Secure. Smart.
              </span>
            </h1>

            <p className="mt-6 text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto relative z-10">
              MedVita streamlines the connection between doctors and patients. Experience a seamless, secure, and intelligent way to manage appointments, prescriptions, and health records.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link
                to="/signup"
                className="px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative z-10">Get Started Free</span>
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 text-base font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:border-cyan-300 dark:hover:border-cyan-600 transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 group/link shadow-lg"
              >
                Sign In <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Feature cards */}
            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3 relative z-10">
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl flex flex-col items-center hover:-translate-y-2 hover:scale-105 transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white mb-2">Secure & Private</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">End-to-end encryption for your peace of mind</span>
              </div>

              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl flex flex-col items-center hover:-translate-y-2 hover:scale-105 transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white mb-2">Patient Focused</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Designed with empathy for better care</span>
              </div>

              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl flex flex-col items-center hover:-translate-y-2 hover:scale-105 transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-8 w-8" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white mb-2">Real-time Updates</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Instant notifications for important events</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
