import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import clsx from 'clsx'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="glass-panel relative inline-flex h-10 w-10 items-center justify-center !rounded-xl !p-0 transition-transform hover:scale-105 active:scale-95 overflow-hidden"
      aria-label="Toggle Dark Mode"
    >
      <div className={clsx("absolute transition-all duration-300 transform", isDark ? "rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100")}>
        <Sun className="h-6 w-6 text-yellow-500" />
      </div>
      <div className={clsx("absolute transition-all duration-300 transform", isDark ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-0")}>
        <Moon className="h-6 w-6 text-blue-400" />
      </div>
    </button>
  )
}
