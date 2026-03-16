import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, loading, isOnboardingComplete } = useAuth()

  // Mientras carga la sesión, mostrar spinner neutro
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Sin sesión → login
  if (!session) return <Navigate to="/auth" replace />

  // Con sesión pero sin onboarding → onboarding
  if (!isOnboardingComplete) return <Navigate to="/onboarding" replace />

  return children
}