import {
  createContext, useContext, useEffect,
  useState, useCallback, useRef
} from 'react'
import { supabase, refreshSessionSafely } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,        setSession]        = useState(null)
  const [profile,        setProfile]        = useState(null)
  const [initializing,   setInitializing]   = useState(true)
  const [isSyncing,      setIsSyncing]      = useState(false)
  // null = no verificado aún | false = no rechazado | true = rechazado
  const [wasRejected,    setWasRejected]    = useState(null)
  const [showPostLoginSplash, setShowPostLoginSplash] = useState(false)

  const mountedRef       = useRef(true)
  const busyRef          = useRef(false)
  const syncingRef       = useRef(false)
  const justSignedInRef  = useRef(false)

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data ?? null
  }, [])

  // Consulta el historial usando el email del JWT residual.
  // Esta llamada funciona aunque profiles ya no tenga la fila,
  // porque la política RLS usa auth.jwt()->>'email' directamente.
  const checkRejectionHistory = useCallback(async (email) => {
    if (!email) return false
    const { data } = await supabase
      .from('organizer_requests_history')
      .select('id')
      .eq('email', email)
      .eq('action', 'rejected')
      .limit(1)
      .maybeSingle()
    return Boolean(data)
  }, [])

  const applySession = useCallback(async (rawSession) => {
    if (!rawSession?.user) {
      if (mountedRef.current) {
        setSession(null)
        setProfile(null)
        setWasRejected(false)
      }
      return
    }

    const prof = await fetchProfile(rawSession.user.id)

    if (!mountedRef.current) return

    if (!prof) {
      // Sesión válida pero sin perfil: puede ser ghost session de cuenta borrada.
      // Cruzamos con el historial para saber si fue rechazado.
      const email    = rawSession.user.email ?? ''
      const rejected = await checkRejectionHistory(email)

      if (!mountedRef.current) return

      setSession(rawSession)
      setProfile(null)
      setWasRejected(rejected)
      return
    }

    setSession(rawSession)
    setProfile(prof)
    setWasRejected(false)

    // Splash post-login solo para login fresco de usuario con onboarding completo
    if (justSignedInRef.current && prof?.username && prof?.role) {
      setShowPostLoginSplash(true)
    }
    justSignedInRef.current = false
  }, [fetchProfile, checkRejectionHistory])

  // Limpia únicamente la sesión local (IndexedDB/localStorage).
  // No llama a ninguna Edge Function — el borrado ya lo hizo el admin.
  const clearLocalSession = useCallback(async () => {
    await supabase.auth.signOut()
    if (mountedRef.current) {
      setSession(null)
      setProfile(null)
      setWasRejected(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    async function init() {
      busyRef.current = true
      try {
        const ok = await refreshSessionSafely()
        if (!mountedRef.current) return
        if (!ok) {
          setSession(null)
          setProfile(null)
          setWasRejected(false)
          return
        }
        const { data: { session } } = await supabase.auth.getSession()
        await applySession(session)
      } finally {
        busyRef.current = false
        if (mountedRef.current) setInitializing(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return
        if (event === 'INITIAL_SESSION') return
        if (syncingRef.current) return
        if (busyRef.current) return
        busyRef.current = true
        try {
          if (event === 'SIGNED_OUT') {
            if (mountedRef.current) {
              setSession(null)
              setProfile(null)
              setWasRejected(false)
            }
            return
          }
          await applySession(session)
        } finally {
          busyRef.current = false
        }
      }
    )

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [applySession])

  useEffect(() => {
    async function onVisible() {
      if (document.visibilityState !== 'visible') return
      syncingRef.current = true
      if (mountedRef.current) setIsSyncing(true)
      let waited = 0
      while (busyRef.current && waited < 5000) {
        await new Promise(r => setTimeout(r, 50))
        waited += 50
      }
      try {
        const ok = await refreshSessionSafely()
        if (!mountedRef.current) return
        if (!ok) {
          setSession(null)
          setProfile(null)
          setWasRejected(false)
          return
        }
        const { data: { session } } = await supabase.auth.getSession()
        await applySession(session)
      } finally {
        syncingRef.current = false
        if (mountedRef.current) setIsSyncing(false)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [applySession])

  const isOnboardingComplete = Boolean(profile?.username && profile?.role)

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signIn(email, password) {
    justSignedInRef.current = true
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      justSignedInRef.current = false
      throw error
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    if (mountedRef.current) {
      setSession(null)
      setProfile(null)
      setWasRejected(false)
    }
  }

  async function completeOnboarding(username, role) {
    const status = role === 'organizer' ? 'pending' : 'active'
    const { error } = await supabase
      .from('profiles')
      .update({ username, role, status })
      .eq('id', session.user.id)
    if (error) throw error
    const prof = await fetchProfile(session.user.id)
    if (mountedRef.current) {
      setProfile(prof)
      setWasRejected(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      initializing,
      isSyncing,
      wasRejected,
      clearLocalSession,
      isOnboardingComplete,
      showPostLoginSplash,
      setShowPostLoginSplash,
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