import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  {
    id: 'organizer',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round"/>
        <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round"/>
        <path d="M9 12h6M9 16h4" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Organizador',
    description: 'Creo torneos, gestiono grupos, horarios y resultados.',
  },
  {
    id: 'player',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <circle cx="12" cy="12" r="9"/>
        <path d="M5.5 12 Q12 4 18.5 12 Q12 20 5.5 12Z" strokeLinejoin="round"/>
        <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    title: 'Jugador',
    description: 'Participo en torneos, consulto partidos y clasificación.',
  },
]

function OrganizerPendingNotice() {
  return (
    <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3 mt-1">
      <div className="flex-shrink-0 mt-0.5">
        <svg viewBox="0 0 16 16" fill="none" stroke="#f59e0b" strokeWidth={1.8}
          className="w-4 h-4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6"/>
          <path d="M8 5v3.5M8 11v.5"/>
        </svg>
      </div>
      <p className="text-amber-400/90 text-xs leading-relaxed">
        Tu cuenta requerirá la aprobación de un administrador antes de poder acceder al panel de creación de torneos.
      </p>
    </div>
  )
}

export default function OnboardingPage() {
  const { completeOnboarding, session, isOnboardingComplete } = useAuth()
  const navigate = useNavigate()

  const [selectedRole, setSelectedRole] = useState(null)
  const [username,     setUsername]     = useState('')
  const [error,        setError]        = useState('')
  const [busy,         setBusy]         = useState(false)
  const [step,         setStep]         = useState(1)

  if (isOnboardingComplete) {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleFinish() {
    if (!username.trim()) { setError('El nombre de usuario es obligatorio.'); return }
    if (username.trim().length < 3) { setError('Mínimo 3 caracteres.'); return }
    setError('')
    setBusy(true)
    try {
      await completeOnboarding(username.trim().toLowerCase(), selectedRole)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err.message?.includes('duplicate') || err.message?.includes('unique')
          ? 'Ese nombre de usuario ya está en uso.'
          : err.message
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-950 flex flex-col px-6">

      <div className="flex items-center justify-center gap-2 pt-14 pb-10">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-neon-300' : 'w-4 bg-surface-600'}`} />
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-neon-300' : 'w-4 bg-surface-600'}`} />
      </div>

      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">

        {step === 1 && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <h2 className="text-ink-primary text-2xl font-semibold tracking-tight">
                ¿Cuál es tu rol?
              </h2>
              <p className="text-ink-muted text-sm mt-2">
                Hola, <span className="text-neon-400">{session?.user?.email}</span>.
                Cuéntanos cómo usarás la app.
              </p>
            </div>

            <div className="space-y-3 mb-3">
              {ROLES.map((role) => {
                const active = selectedRole === role.id
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`
                      w-full text-left p-4 rounded-2xl border transition-all duration-200
                      flex items-start gap-4
                      ${active
                        ? 'bg-neon-900/30 border-neon-700 shadow-neon-sm'
                        : 'bg-surface-900 border-border-default hover:border-border-strong'
                      }
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200
                      ${active ? 'bg-neon-800/60 text-neon-300' : 'bg-surface-700 text-ink-secondary'}
                    `}>
                      {role.icon}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <p className={`font-semibold text-sm transition-colors ${active ? 'text-neon-300' : 'text-ink-primary'}`}>
                        {role.title}
                      </p>
                      <p className="text-ink-muted text-xs mt-1 leading-relaxed">
                        {role.description}
                      </p>
                    </div>

                    <div className={`
                      w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5
                      transition-all duration-200
                      ${active ? 'bg-neon-300 border-neon-300' : 'border-border-strong'}
                    `}>
                      {active && (
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                          <path d="M2 6l3 3 5-5" stroke="#0f1010" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedRole === 'organizer' && (
              <div className="mb-6">
                <OrganizerPendingNotice />
              </div>
            )}

            {selectedRole !== 'organizer' && <div className="mb-6" />}

            <button
              disabled={!selectedRole}
              onClick={() => setStep(2)}
              className="
                w-full bg-neon-300 hover:bg-neon-200 active:bg-neon-400
                disabled:opacity-30 disabled:cursor-not-allowed
                text-ink-inverse font-semibold py-3.5 rounded-xl
                transition-all duration-200 text-sm shadow-neon-sm hover:shadow-neon-md
              "
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <button
                onClick={() => { setStep(1); setError('') }}
                className="flex items-center gap-1.5 text-ink-muted text-sm mb-6 hover:text-ink-secondary transition-colors"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Volver
              </button>

              <h2 className="text-ink-primary text-2xl font-semibold tracking-tight">
                Elige tu nombre
              </h2>
              <p className="text-ink-muted text-sm mt-2">
                Este es el nombre que verán los demás en los torneos.
              </p>
            </div>

            <div className="bg-surface-900 border border-border-default rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-900/60 border border-neon-800 flex items-center justify-center text-neon-400">
                {selectedRole === 'organizer' ? (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                    <rect x="3" y="2" width="10" height="12" rx="1.5"/>
                    <path d="M5 6h6M5 9h4" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                    <circle cx="8" cy="8" r="6"/>
                    <path d="M3 8 Q8 3 13 8 Q8 13 3 8Z"/>
                  </svg>
                )}
              </div>
              <div>
                <p className="text-ink-muted text-xs">Rol seleccionado</p>
                <p className="text-neon-300 text-sm font-medium">
                  {selectedRole === 'organizer' ? 'Organizador' : 'Jugador'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              <label className="text-ink-muted text-xs font-medium uppercase tracking-widest">
                Nombre de usuario
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none">
                  @
                </span>
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                  placeholder="tunombre"
                  maxLength={30}
                  className="
                    w-full bg-surface-800 border border-border-default rounded-xl
                    pl-8 pr-4 py-3 text-sm text-ink-primary placeholder-ink-muted
                    focus:outline-none focus:border-neon-600 focus:ring-1 focus:ring-neon-600/30
                    transition-all duration-200
                  "
                />
                {username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-neon-300 flex items-center justify-center">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M2 6l3 3 5-5" stroke="#0f1010" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-ink-muted text-xs pl-1">
                Solo letras, números y guiones bajos.
              </p>
            </div>

            {error && (
              <div className="bg-red-950/60 border border-red-900/50 rounded-xl px-4 py-3 mb-4">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              onClick={handleFinish}
              disabled={busy || username.trim().length < 3}
              className="
                w-full bg-neon-300 hover:bg-neon-200 active:bg-neon-400
                disabled:opacity-30 disabled:cursor-not-allowed
                text-ink-inverse font-semibold py-3.5 rounded-xl
                transition-all duration-200 text-sm shadow-neon-sm hover:shadow-neon-md
              "
            >
              {busy ? 'Guardando...' : 'Comenzar →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}