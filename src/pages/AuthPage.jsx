import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import lobo from '../assets/lobo.png'

export default function AuthPage() {
  const { signIn, signUp, session, profile, isOnboardingComplete } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  if (session) {
    const home = isOnboardingComplete
      ? (profile?.role === 'player' ? '/player' : '/dashboard')
      : '/onboarding'
    navigate(home, { replace: true })
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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at top, rgba(27,58,92,0.18) 0%, transparent 60%), #1E2024' }}
    >
      {/* Zona superior — Escudo + identidad */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">

        {/* Escudo HGV */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src={lobo}
            alt="Escudo Frontón HGV"
            style={{ width: '80px', height: 'auto', display: 'block' }}
          />
          <div className="text-center">
            <h1
              style={{
                color: '#E5E7EB',
                fontSize: '16px',
                fontWeight: 500,
                margin: 0,
                letterSpacing: '0.02em',
              }}
            >
              Comisión de Frontón
            </h1>
            <p className="text-ink-muted text-xs mt-1">Hermandad Gallega de Venezuela</p>
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
              <label
                htmlFor="auth-email"
                className="text-ink-muted text-xs font-medium uppercase tracking-widest"
              >
                Correo electrónico
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nombre@correo.com"
                className="
                  w-full bg-surface-900 border border-border-default rounded-xl
                  px-4 py-3 text-sm text-ink-primary placeholder-ink-muted
                  focus:outline-none focus:border-neon-300 focus:ring-1 focus:ring-neon-300/30
                  transition-all duration-200
                "
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="auth-password"
                className="text-ink-muted text-xs font-medium uppercase tracking-widest"
              >
                Contraseña
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="
                  w-full bg-surface-900 border border-border-default rounded-xl
                  px-4 py-3 text-sm text-ink-primary placeholder-ink-muted
                  focus:outline-none focus:border-neon-300 focus:ring-1 focus:ring-neon-300/30
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
                w-full bg-neon-300 hover:bg-neon-400 active:bg-neon-400
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
          Frontón
        </p>
      </div>
    </div>
  )
}
