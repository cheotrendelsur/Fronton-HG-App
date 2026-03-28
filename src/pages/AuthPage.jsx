import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { signIn, signUp, session, isOnboardingComplete } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  if (session) {
    navigate(isOnboardingComplete ? '/dashboard' : '/onboarding', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      mode === 'register' ? await signUp(email, password) : await signIn(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-950 flex flex-col">

      {/* Zona superior — Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">

        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-border-default flex items-center justify-center shadow-neon-sm">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <circle cx="16" cy="16" r="13" stroke="#b8f533" strokeWidth="2"/>
              <path d="M9 16 Q16 7 23 16 Q16 25 9 16Z" fill="#b8f533" opacity="0.85"/>
              <line x1="4" y1="16" x2="28" y2="16" stroke="#b8f533" strokeWidth="1.2" opacity="0.4"/>
              <line x1="16" y1="3" x2="16" y2="29" stroke="#b8f533" strokeWidth="1.2" opacity="0.4"/>
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-ink-primary text-2xl font-semibold tracking-tight">RacketTourneys</h1>
            <p className="text-ink-muted text-sm mt-1">Torneos de deportes de raqueta</p>
          </div>
        </div>

        {/* Card principal */}
        <div className="w-full max-w-sm">

          {/* Tabs modo */}
          <div className="flex bg-surface-800 rounded-2xl p-1 mb-6 border border-border-subtle">
            {[
              { id: 'login',    label: 'Iniciar sesión' },
              { id: 'register', label: 'Registrarse'    },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setMode(id); setError('') }}
                className={`
                  flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${mode === id
                    ? 'bg-neon-300 text-ink-inverse shadow-neon-sm'
                    : 'text-ink-muted hover:text-ink-secondary'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-ink-muted text-xs font-medium uppercase tracking-widest">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nombre@correo.com"
                className="
                  w-full bg-surface-800 border border-border-default rounded-xl
                  px-4 py-3 text-sm text-ink-primary placeholder-ink-muted
                  focus:outline-none focus:border-neon-600 focus:ring-1 focus:ring-neon-600/30
                  transition-all duration-200
                "
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-ink-muted text-xs font-medium uppercase tracking-widest">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="
                  w-full bg-surface-800 border border-border-default rounded-xl
                  px-4 py-3 text-sm text-ink-primary placeholder-ink-muted
                  focus:outline-none focus:border-neon-600 focus:ring-1 focus:ring-neon-600/30
                  transition-all duration-200
                "
              />
            </div>

            {error && (
              <div className="bg-red-950/60 border border-red-900/50 rounded-xl px-4 py-3">
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="
                w-full bg-neon-300 hover:bg-neon-200 active:bg-neon-400
                disabled:opacity-40 disabled:cursor-not-allowed
                text-ink-inverse font-semibold py-3.5 rounded-xl
                transition-all duration-200 text-sm tracking-wide
                shadow-neon-sm hover:shadow-neon-md
                mt-2
              "
            >
              {busy
                ? 'Procesando...'
                : mode === 'login' ? 'Entrar' : 'Crear cuenta'
              }
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-12 text-center">
        <p className="text-ink-muted text-xs">
          Tenis · Pádel · Pickleball · Beach Tennis · Frontón
        </p>
      </div>
    </div>
  )
}