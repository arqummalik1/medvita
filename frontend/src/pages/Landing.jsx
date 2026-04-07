import { Link } from 'react-router-dom'
import { Activity, Shield, Zap, Heart, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import ThemeToggle from '../components/ThemeToggle'

const ECGGraph = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
    <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path
        d="M0,50 L200,50 L220,20 L240,80 L260,50 L400,50 L420,10 L440,90 L460,50 L700,50 L720,20 L740,80 L760,50 L1000,50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-cyan-500 dark:text-cyan-400"
      />
      <div className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent ecg-line-scan" />
    </svg>
  </div>
);

const FeatureBadge = ({ icon: Icon, text }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/30 shadow-sm"
  >
    <Icon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
    <span className="text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{text}</span>
  </motion.div>
);

export default function Landing() {
  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 relative flex flex-col font-sans transition-colors duration-700">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 medical-grid opacity-[0.03] dark:opacity-[0.05]" />
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />

      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-6 md:px-12 py-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-500">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
            Med<span className="text-cyan-500">Vita</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 md:gap-8">
          <ThemeToggle />
          <Link
            to="/login"
            className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors uppercase tracking-widest"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/10"
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content Hub */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6">
        <ECGGraph />

        <div className="max-w-4xl w-full text-center space-y-8 md:space-y-12 mb-12">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <FeatureBadge icon={Shield} text="GDPR Compliant" />
            <FeatureBadge icon={Zap} text="AI Diagnostics" />
            <FeatureBadge icon={Heart} text="Patient Centric" />
          </div>

          {/* Core Message */}
          <div className="space-y-4 md:space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[0.9] tracking-tighter text-slate-900 dark:text-white text-balance"
            >
              Healthcare <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600">Reimagined.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-2xl mx-auto text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
            >
              The premium, all-in-one patient management system for modern practitioners.
              Simple. Secure. Smart.
            </motion.p>
          </div>

          {/* Dynamic CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              to="/signup"
              className="w-full sm:w-auto px-10 py-5 rounded-[2rem] bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-lg shadow-2xl shadow-cyan-500/40 hover:scale-105 hover:shadow-cyan-500/60 transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              Start Your Practice <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 py-3 sm:py-0 px-4">
              Join 10k+ Specialists
            </p>
          </motion.div>
        </div>

        {/* Floating Trust Indicators (Low-key) */}
        <div className="absolute bottom-12 left-12 hidden lg:flex flex-col gap-4">
          <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">End-to-End Encryption</span>
          </div>
        </div>
      </main>

      {/* Footer Branding (Subtle) */}
      <footer className="relative z-10 py-8 px-12 flex justify-center opacity-40">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} MedVita Ecosystem &bull; Precision Care
        </p>
      </footer>
    </div>
  )
}
