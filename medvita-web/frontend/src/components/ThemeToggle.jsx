import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import clsx from 'clsx'

export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        "relative p-2.5 rounded-xl transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 group overflow-hidden",
        theme === 'dark' 
          ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 shadow-lg shadow-amber-500/20" 
          : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-600 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 shadow-lg shadow-cyan-500/20",
        className
      )}
      aria-label="Toggle Dark Mode"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-500 group-hover:-rotate-12" />
        )}
      </div>
    </button>
  )
}
