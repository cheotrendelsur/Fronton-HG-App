import { Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function StatusScreen({ icon, title, message, action }) {
  return (
    <div className="min-h-screen bg-base-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: '#1a1c1c', border: '1px solid #2a2e2e' }}
        >
          {icon}
        </div>
        <div className="space-y-2">
          <h1 className="text-ink-primary text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-ink-muted text-sm leading-relaxed">{message}</p>
        </div>
        {action}
      </div>
    </div>
  )
}

function RejectedScreen() {
  const { clearLocalSession } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function handleExit() {
    setBusy(true)
    // Solo limpia la sesión local — el admin ya borró la cuenta de auth.users
    await clearLocalSession()
    navigate('/auth', { replace: true })
  }

  return (
    <StatusScreen
      title="Solicitud Rechazada"
      message="Tu solicitud para ser organizador fue revisada y no fue aprobada. Puedes registrarte nuevamente con otro correo."
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={1.8}
          className="w-8 h-8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      }
      action={
        <button
          onClick={handleExit}
          disabled={busy}
          className="
            w-full py-3.5 rounded-xl text-sm font-semibold
            bg-surface-800 border border-border-strong
            text-ink-secondary hover:text-ink-primary
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {busy ? 'Cerrando sesión...' : 'Aceptar y Salir'}
        </button>
      }
    />
  )
}

export default function ProtectedRoute({ children }) {
  const { session, profile, isOnboardingComplete, wasRejected, initializing } = useAuth()

  // Mientras AuthContext verifica el historial, no renderizar nada
  // para evitar un flash de /onboarding
  if (initializing || wasRejected === null) return null

  if (!session) return <Navigate to="/auth" replace />

  // Sesión residual + confirmado como rechazado en el historial
  if (wasRejected) return <RejectedScreen />

  // Sesión válida pero sin perfil: onboarding nuevo o ghost no rechazado
  if (!profile) return <Navigate to="/onboarding" replace />

  if (!isOnboardingComplete) return <Navigate to="/onboarding" replace />

  if (profile?.status === 'pending') {
    return (
      <StatusScreen
        title="Solicitud en Revisión"
        message="Tu cuenta de organizador está siendo evaluada. Te avisaremos por correo cuando sea aprobada."
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={1.8}
            className="w-8 h-8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 3"/>
          </svg>
        }
      />
    )
  }

  return children
}