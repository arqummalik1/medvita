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

  const [appStyle, setAppStyle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appStyle') || 'modern'
    }
    return 'modern'
  })

  useEffect(() => {
    const root = window.document.documentElement

    // Theme Class
    root.classList.remove('light', 'dark')
    root.classList.add(theme)

    // Density Attribute
    root.setAttribute('data-density', density)

    // App Style Attribute
    root.setAttribute('data-app-style', appStyle)

    // Save to localStorage
    localStorage.setItem('theme', theme)
    localStorage.setItem('density', density)
    localStorage.setItem('appStyle', appStyle)
  }, [theme, density, appStyle])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      density,
      setDensity,
      appStyle,
      setAppStyle
    }}>
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
