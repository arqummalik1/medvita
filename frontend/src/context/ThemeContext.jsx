import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        return savedTheme
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    }
    return 'light'
  })

  const [density, setDensity] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('density') || 'normal'
    }
    return 'normal'
  })

  useEffect(() => {
    const root = window.document.documentElement

    // Remove previous class
    root.classList.remove('light', 'dark')
    // Add new class
    root.classList.add(theme)

    // Set density attribute
    root.setAttribute('data-density', density)

    // Save to localStorage
    localStorage.setItem('theme', theme)
    localStorage.setItem('density', density)
  }, [theme, density])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
