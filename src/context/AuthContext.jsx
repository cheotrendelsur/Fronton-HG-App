import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined) // undefined = cargando
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  // Carga el perfil del usuario desde Supabase
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
    else setProfile(null)
  }

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de sesión (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Determina si el onboarding está completo
  const isOnboardingComplete = Boolean(profile?.username && profile?.role)

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function completeOnboarding(username, role) {
    const { error } = await supabase
      .from('profiles')
      .update({ username, role })
      .eq('id', session.user.id)
    if (error) throw error
    // Refrescar perfil local
    await fetchProfile(session.user.id)
  }

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      isOnboardingComplete,
      signUp,
      signIn,
      signOut,
      completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}