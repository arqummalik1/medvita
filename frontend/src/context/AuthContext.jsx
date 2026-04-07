import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(null)

  const fetchProfile = useCallback(async (userId) => {
    try {
      setProfileError(null)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfileError(error.message)
      } else {
        setProfile(data)
      }
      return data
    } catch (error) {
      console.error('Error:', error)
      setProfileError(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] State Change:', event)

      if (session?.user) {
        setUser(session.user)
        setLoading(true)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async (email, password, role, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
      },
    })

    if (error) throw error
    return data
  }

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = () => {
    return supabase.auth.signOut()
  }

  const value = {
    user,
    profile,
    loading,
    profileError,
    signUp,
    signIn,
    signOut,
    fetchProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
